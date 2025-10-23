const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review cannot be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to user']
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to tour']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({tour: 1,user:1},{unique: true});

// instead of putting populate in every function in controller make a querey middleware . select( select only things i want , - means i dont want in the output)
// using popualte too much in code will slow down response due to doing query to get names of the tour etc
reviewSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'tour',
//     select: 'name'
//   }).populate({
//     path: 'user',
//     select: 'name photo'
//   });

    this.populate({
        path: "user",
        select: "name photo"
    });
  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
