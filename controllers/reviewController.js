const Review = require('./../Models/reviewModel');
const factory = require("./factoryController")

exports.setUserTourIds = (req,res,next) =>{
  // to allow nested routes to see if body of req body doesnt contain tour , get it from the url
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  if (!req.body.user) {
    req.body.user = req.user.id;
  }
  next();
}

exports.getAllReviews = factory.getAll(Review);
exports.getReviewById = factory.getOne(Review);
exports.createNewReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
