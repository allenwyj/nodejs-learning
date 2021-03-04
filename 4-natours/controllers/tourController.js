const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.aliasTopTours = async (req, res, next) => {
  // prefilling limit, sort, fields
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // BUILD QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limit()
    .pagination();

  // EXECUTE QUERY
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTourById = catchAsync(async (req, res, next) => {
  const tourId = req.params.id;
  const tour = await Tour.findById(tourId).populate('reviews');

  /* MOVED TO TOUR MODEL - QUERY MIDDLEWARE
  // Expanding guides field - so it will use the reference to query back
  // the details of guides, excluding __v and passwordChangeAt fields.
  const tour = await Tour.findById(tourId).populate({
    path: 'guides',
    select: '-__v -passwordChangeAt',
  }); 
  */

  // shorthand to this: Tour.findOne({ _id: tourId })

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.createTour = factory.createOne(Tour);

exports.updateTourById = factory.updateOne(Tour);

exports.deleteTourById = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: '$difficulty', // grouping attribute
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        // getting the month from a date type field
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        // create a new array and push the name of tour into the array
        tours: { $push: '$name' },
      },
    },
    // {
    //   // $addField is not allowed in this atlas tier.
    //   $addField: { month: '$_id' },
    // },
    // {
    //   $project: {
    //     _id: 0,
    //     month: '$_id',
    //     numTourStarts: 1,
    //     tours: 1,
    //   },
    // },
    {
      $set: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: plan,
  });
});
