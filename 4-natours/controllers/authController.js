const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
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

  // secret key should be more than 32 characters
  const token = generateToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      // excluding password field
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    },
  });
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
  // Giving an new token to the client
  const token = generateToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
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
