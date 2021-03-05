const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  getAllReviews,
  setTourUserIds,
  createReview,
  getReviewById,
  updateReviewById,
  deleteReviewById,
} = require('../controllers/reviewController');

// mergeParams allows to access the params from other routers
const router = express.Router({ mergeParams: true });

router.use(protect);

// By using merge parameter, this router can be accessed by:
// /api/v1/reviews
// /api/v1/tours/:tourId/reviews
router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReviewById)
  .patch(restrictTo('user', 'admin'), updateReviewById)
  .delete(restrictTo('user', 'admin'), deleteReviewById);

module.exports = router;
