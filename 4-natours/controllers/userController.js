const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Filtered out any key:value pair if it is not in allowedFields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Public
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

// @desc    Update a user, user id will be decoded from protect middleware
// @route   GET /api/v1/users/update-me
// @access  Private
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Send error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /update-my-password',
        400
      )
    );
  }

  // 2) Filter out any sensitive data
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// @desc    Delete a user, user id will be decoded from protect middleware
// @route   GET /api/v1/users/delete-me
// @access  Private
exports.deleteMe = catchAsync(async (req, res, next) => {
  // Not actually deleting the user, setting to inactive user instead.
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUserById = catchAsync(async (req, res, next) => {
  // const tourId = req.params.id;
  // const tour = await Tour.findById(tourId);
  // // shorthand to this: Tour.findOne({ _id: tourId })
  // if (!tour) {
  //   return next(new AppError('No tour found with that ID', 404));
  // }
  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     tour,
  //   },
  // });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.updateUserById = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.deleteUserById = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
