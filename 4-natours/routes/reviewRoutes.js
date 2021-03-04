const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  getAllReviews,
  createReview,
  updateReviewById,
  deleteReviewById,
} = require('../controllers/reviewController');

// mergeParams allows to access the params from other routers
const router = express.Router({ mergeParams: true });

// By using merge parameter, this router can be accessed by:
// /api/v1/reviews
// /api/v1/tours/:tourId/reviews
router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), createReview);

router.route('/:id').patch(updateReviewById).delete(deleteReviewById);

module.exports = router;
