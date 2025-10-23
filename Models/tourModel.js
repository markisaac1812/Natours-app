const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, ' name is required'],
      unique: true,
      maxlength: [40, 'name must not exceed 40 char'],
      minlength: [5, 'name must exceed 5 char']
      // validate: [validator.isAlpha,"name must have letters only"]
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, ' duration is a required']
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'a group must have a size']
    },

    difficulty: {
      type: String,
      required: [true, ' must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficuty is either easy , medium ,difficult'
      }
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'min is 1'],
      max: [5.1, ' max is 5']
    },

    ratingsQuantity: {
      type: Number,
      default: 0
    },

    price: {
      type: Number,
      required: [true, 'tour price is required']
    },

    PriceDiscount: {
      type: Number,
      // this only points  to current doc on NEW document creation
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Error Price must be bigger than PriceDiscount'
      }
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'must have a description']
    },

    description: {
      type: String,
      trim: true
    },

    imageCover: {
      type: String,
      required: [true, ' tour must have an image']
    },

    images: {
      type: [String]
    },

    CoverdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },

    startDates: {
      type: [Date]
    },

    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GEOJson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations:[
     {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
    // guides: Array (this if want to make it embeded instead of refrence)
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.index({price: 1,ratingsAverage: -1});
tourSchema.index({startLocation: "2dsphere"});

tourSchema.virtual('durationWeeks').get(function () {
  // okay so now virtual used to keep fat models thin controolers and we used function not callback cause we want to use this and virtual is not part of the original db
  return this.duration / 7;
});

tourSchema.virtual("reviews",{
  ref: "Review",
  foreignField: "tour",
  localField: "_id"
});


//Document Middleware: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  // or tourSchema.post()
  this.slug = slugify(this.name, { lower: true });
  next();
});

// for embeded
// tourSchema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

//query middleware
tourSchema.pre(/^find/, function (next) {
  // regex so any function starts with find like find,findOne,findbyid,etc
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/,function(next){
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt"
  });
  next();
});

//Aggregation middleware
tourSchema.pre('aggregate', function (next) {
  //console.log(this.pipeline);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
