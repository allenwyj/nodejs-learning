const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const cookieOptions = {
    // telling the clients when this cookie will be expired and can be deleted.
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // Cookie cannot be accessed or modified in anyway by the browser
    httpOnly: true,
  };

  // Cookie is sent in HTTPS
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // Define the cookie
  res.cookie('jwt', token, cookieOptions);

  // Remove the password from the creation output, but not deleting from the DB
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.restrictTo = (...roles) =>
  catchAsync(async (req, res, next) => {
    // Check if user.role is included in roles
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Permission denied.', 403));
    }
    next();
  });

// @desc    Sign up a user
// @route   GET /api/v1/users/signup
// @access  Public
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // TODO: Might be better to do in req.body
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

// @desc    Login a user
// @route   GET /api/v1/users/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and pasword exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  // If user can be found or passwords are matched
  if (!user || !(await user.matchPassword(password, user.password))) {
    // unauthorised
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to the client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Getting token and check if token is not null
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Unauthorised
  if (!token) {
    return next(
      new AppError('Not authorised, please try to log in again'),
      401
    );
  }

  // 2. Verify the token

  // jwt.verify synchronously returns the decoded token,
  // promisefy() converts it to return a promise object.
  // If verify() has errors (invalid token or exipred token), it will be handled.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4. Check if user changed password after token was issued
  if (currentUser.changedPasswordAfterTokenIssued(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});

// @desc    Forgot password, send a reset link to user's email address
// @route   GET /api/v1/users/forgot-password
// @access  Public
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  // Saving the changes from the last method
  // validateBeforeSave - turns the validation off
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const message =
    `Forgot your password? ` +
    `Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.` +
    `\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 mins)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email.',
    });
  } catch (err) {
    // reset the fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // save the modification
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

// @desc    Reset password
// @route   GET /api/v1/users/reset-password
// @access  Public
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If the token is not expired, and the user exists, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 3) Update changedPasswordAt field for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

// @desc    Update user's password
// @route   GET /api/v1/users/update-my-password
// @access  Private
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the collection
  // Assuming that user is logged in, and passed the protect route.
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!user) {
    return next(
      new AppError(
        'Sorry, the current user is no longer existing in the system.',
        400
      )
    );
  }

  if (!(await user.matchPassword(req.body.currentPassword, user.password))) {
    return next(
      new AppError('Sorry, the current password is not matched.'),
      401
    );
  }

  // 3) Update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});
