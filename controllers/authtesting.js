const jwt = require('jsonwebtoken');
const User = require('./../Models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// 1. Generate Access and Refresh Tokens
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  });
};

// 2. Send Tokens (Access as response, Refresh as httpOnly cookie)
const createSendToken = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set Refresh Token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Optional: You can also set access token as cookie if you prefer
  // res.cookie('jwt', accessToken, { httpOnly: true, ... });

  user.password = undefined; // Remove password before sending user

  res.status(statusCode).json({
    status: 'success',
    accessToken,
    data: { user }
  });
};

// 3. Login Route
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email & password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Send tokens
  createSendToken(user, 200, res);
});

exports.refreshAccessToken = catchAsync(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) return next(new AppError('No refresh token found', 401));

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('User no longer exists', 401));

  const newAccessToken = generateAccessToken(user._id);

  res.status(200).json({
    status: 'success',
    accessToken: newAccessToken
  });
});
