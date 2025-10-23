const express = require('express');
const router = express.Router();
const bookingController = require('./../controllers/bookingContoller');
const authController = require('./../controllers/authController');

router.use(authController.protect);

// Route that only requires authentication (any logged-in user)
router.get('/checkout-session/:tourID', authController.protect, bookingController.getCheckoutSession);

// Routes that require admin/lead-guide role
router.use(authController.restrictedTo('admin', 'lead-guide'));

router.route('/').get(bookingController.getAllBooking).post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
