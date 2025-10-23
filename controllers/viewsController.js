const Tour = require('./../Models/tourModel');
const Booking = require("./../Models/bookingModel")
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('./../Models/userModel');

exports.getOverview = catchAsync(async (req, res) => {
  //1) get tour data from DB
  const tours = await Tour.find();
  //2) build template

  //3) Render that template using tour data from step 1
  res.status(200).render('overview', {
    title: 'All tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) get the data for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('there is no tour with that name', 404));
  }
  //2) build template

  //3) Render template from step 1
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

exports.getSignupForm = (req,res)=>{
  res.status(200).render('signup',{
    title: "sign up into your account"
  })
}

exports.getMyTours = catchAsync(async(req,res)=>{
  //1) find all bookings
  const bookings = await Booking.find({user: req.user.id});

  //2) find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({_id:{$in: tourIDs}});

  res.status(200).render('overview',{
    title: 'My tours',
    tours
  })
});

exports.updateUserData = async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );
  res.status(200).json({
    title: 'your account',
    user: updatedUser
  });
};
