const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');
// const catchAsync = require('../utils/catchAsync');

exports.setTourUserIds = (req, res, next) => {
  // nested routes
  // if tour and user are not from  the body
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // user object is passed from the protect middleware
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.createReview = factory.createOne(Review);

exports.getReviewById = factory.getOne(Review);

exports.getAllReviews = factory.getAll(Review);

exports.updateReviewById = factory.updateOne(Review);

exports.deleteReviewById = factory.deleteOne(Review);
