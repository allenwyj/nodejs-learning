const express = require('express');
const {
  checkBody,
  getAllTours,
  createTour,
  getTourById,
  updateTourById,
  deleteTourById,
} = require('../controllers/tourController');
const router = express.Router();

// Param middleware
// router.param('id', checkId);

router.route('/').get(getAllTours).post(checkBody, createTour);

router
  .route('/:id')
  .get(getTourById)
  .patch(updateTourById)
  .delete(deleteTourById);

module.exports = router;
