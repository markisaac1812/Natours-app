const express = require('express');
const router = express.Router();
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const authtesting = require('./../controllers/authtesting');

router.route('/signup').post(authController.signUp);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);
router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

//protect all routes after this middleware
router.use(authController.protect);

router.route('/updateMyPassword').patch(authController.updatePassword);
router.route('/me').get(userController.getMe, userController.GetUserById);
router.route('/updateMe').patch(userController.uploadUserPhoto,userController.resizeUserPhoto, userController.updateMe);
router.route('/deleteMe').delete(userController.deleteMe);

//router.route("/refreshToken").post(authtesting.refreshAccessToken);  for testing

router.use(authController.restrictedTo('admin'));

router.route('/').get(userController.GetAllUsers).post(userController.CreateNewUser);

router
  .route('/:id')
  .get(userController.GetUserById)
  .patch(userController.UpdateUserByiD)
  .delete(userController.DeleteUserById);
module.exports = router;



