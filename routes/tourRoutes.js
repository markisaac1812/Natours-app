const express = require('express');
const router = express.Router();
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRoutes');

router
  .route('/')
  .get(tourController.GetAllTours)
  .post(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.CreateNewTour
  );

router.route('/top-5-cheaps').get(tourController.aliasTopTours, tourController.GetAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router.route('/tours-within/:distance/centre/:latlng/unit/:unit').get(tourController.getTourStatsWithin);

router
  .route('/:id')
  .get(tourController.GetTourById)
  .patch(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.UpdateTour
  )
  .delete(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.DeleteTour
  );

router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
