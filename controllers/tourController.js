const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const Tour = require('./../Models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./factoryController');

const multerStorage = multer.memoryStorage();

const multetFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload an image only', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multetFilter });
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  //1) cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2)images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  console.log(req.body);
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.CreateNewTour = factory.createOne(Tour);
// exports.CreateNewTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'Success',
//     data: { tour: newTour }
//   });
// });

exports.GetAllTours = factory.getAll(Tour);
// exports.GetAllTours = async (req, res) => {
//   try {
//     // Build query
//     // 1A filtering
//     const queryObj = {...req.query};
//     const execultedaFields = ["page","sort","limit","fields"];
//     execultedaFields.forEach(el => delete queryObj[el]);

//     // 1B advanced filtering
//     let queryStr = JSON.stringify(queryObj);
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match=> `$${match}`);
//     let query = Tour.find(JSON.parse(queryStr));

//     // 2 Sorting
//     if(req.query.sort){
//       const Sortby = req.query.sort.split(",").join(" ");
//       query = query.sort(Sortby);
//     }else{
//       query = query.sort("-CoverdAt");
//     }

//     //3 filed Limiting
//     if(req.query.fields){
//       const fields = req.query.fields.split(",").join(" ");
//       query = query.select(fields);
//     }else{
//       query = query.select("-__v");
//     }

//     //4 pagination
//     const page = req.query.page *1 ||1;
//     const limit = req.query.limit *1 || 100;
//     const skip = (page - 1) * limit;

//     query = query.skip(skip).limit(limit);

//     if(req.query.page){
//       const numTours = await Tour.countDocuments();
//       if(skip >= numTours){
//         throw new Error("this page does not exist");
//       }
//     }

//     const tours = await query;

//     res.status(201).json({
//       status: 'success',
//       results: tours.length,
//       data: {
//         Tours: tours
//       }
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'failed',
//       message: err
//     });
//   }
// };

exports.GetTourById = factory.getOne(Tour, { path: 'reviews' });
// exports.GetTourById = catchAsync(async (req, res, next) => {
//   const tourById = await Tour.findById(req.params.id).populate('reviews');
//   if (!tourById) {
//     return next(new AppError('No tour with this id', 404));
//   }
//   res.status(201).json({
//     status: 'successfull',
//     data: {
//       tour: tourById
//     }
//   });
// });

exports.UpdateTour = factory.updateOne(Tour);
// exports.UpdateTour = catchAsync(async (req, res, next) => {
//   const UpdatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });
//   if (!UpdatedTour) {
//     return next(new AppError('No tour with this id', 404));
//   }
//   res.status(201).json({
//     status: 'successfull',
//     data: {
//       updatedT: UpdatedTour
//     }
//   });
// });

exports.DeleteTour = factory.deleteOne(Tour);
// exports.DeleteTour = catchAsync(async (req, res, next) => {
//   const Dtour = await Tour.findByIdAndDelete(req.params.id);
//   if (!Dtour) {
//     return next(new AppError('No tour with this id', 404));
//   }
//   res.status(204).json({
//     status: 'Successfull',
//     data: null
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } } // $match is just like .find(), but inside the pipeline. It filters the documents that match the condition.
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);

  res.status(200).json({
    status: 'successfull',
    results: stats.length,
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' //Explode the startDates array so each date becomes its own document. it is used in array mainly
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'successfull',
    data: {
      plan
    }
  });
});

exports.getTourStatsWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(new AppError('please provide lattiude and longitude', 400));
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    results: tours.length,
    status: 'success',
    data: {
      data: tours
    }
  });
});
