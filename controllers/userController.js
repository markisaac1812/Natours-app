const sharp = require('sharp');
const multer = require('multer');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../Models/userModel');
const AppError = require('../utils/appError');
const factory = require('./factoryController');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();

const multetFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload an image only', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multetFilter });
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedProperties) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedProperties.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.GetAllUsers = factory.getAll(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) create error if user Posted to update password
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('this is not the route for updating password.', 400));
  }
  //2) filter name and email things only user can update from req.body
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  //3) update user data
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.CreateNewUser = (req, res) => {
  res.status(500).json({
    status: 'invalid server error',
    message: 'this route is not defined please use sign up'
  });
};

exports.GetUserById = factory.getOne(User);
exports.UpdateUserByiD = factory.updateOne(User);
exports.DeleteUserById = factory.deleteOne(User);
