const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.setTourUserIds = (req, res, next) => {
  // nested routes
  // if tour and user are not from  the body
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // user object is passed from the protect middleware
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.createReview = factory.createOne(Review);

exports.updateReviewById = factory.updateOne(Review);

exports.deleteReviewById = factory.deleteOne(Review);
