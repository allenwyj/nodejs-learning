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
      user: newUser,
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
