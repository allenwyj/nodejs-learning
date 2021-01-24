const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = async (req, res, next) => {
  // prefilling limit, sort, fields
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

exports.getAllTours = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getTourById = async (req, res) => {
  try {
    const tourId = req.params.id;
    const tour = await Tour.findById(tourId);
    // shorthand to this: Tour.findOne({ _id: tourId })

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    // Calling method of the document
    // const newTour = new Tour({})
    // newTour.save()

    // Calling method of the Tour model
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.updateTourById = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.deleteTourById = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    // delete response status code : 204
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
