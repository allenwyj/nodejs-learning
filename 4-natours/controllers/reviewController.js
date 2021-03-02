const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  // nested routes
  // if tour and user are not from body
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // user can be passed from protect middleware
  if (!req.body.user) req.body.user = req.user.id;

  const newReivew = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReivew,
    },
  });
});
