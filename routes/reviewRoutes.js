const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictedTo('user'),
    reviewController.setUserTourIds,
    reviewController.createNewReview
  );

router
  .route('/:id')
  .delete(authController.restrictedTo('user,admin'), reviewController.deleteReview)
  .patch(authController.restrictedTo('user,admin'), reviewController.updateReview)
  .get(reviewController.getReviewById);

module.exports = router;
