const express = require('express');
const {
  getAllTours,
  createTour,
  getTourById,
  updateTourById,
  deleteTourById,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Param middleware
// router.param('id', checkId);

// Mounting the router: specifying if the url is the matching case,
// routing to reviewRouter.
router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheaps').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats);

router.route('/monthly-plan/:year').get(getMonthlyPlan);

router.route('/').get(protect, getAllTours).post(createTour);

router
  .route('/:id')
  .get(getTourById)
  .patch(updateTourById)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTourById);

module.exports = router;
