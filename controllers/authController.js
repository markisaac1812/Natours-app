const AppError = require('../utils/appError');
const User = require('./../Models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const util = require('util');
const Email = require('./../utils/email');
const crypto = require('crypto');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax'
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  //Remove user password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user
    }
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role
  });

  try {
    const url = `${req.protocol}://${req.get('host')}/me`; // req.protocol: http wla https, req.host: ya3ni local host wla 3000 wla eh
    await new Email(newUser, url).sendWelcome();
  } catch (emailError) {
    console.log('Email sending failed:', emailError);
    // Continue with signup even if email fails
  }

  // we can do this instead of the 5 lines below which is better:  createSendToken(newUser,201,res);
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  //1) first checks if user enter email and password
  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }
  //2) checks if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401));
  }

  //3) if evreything is okay send jwt to user
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) check if user have a token to access tours
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // if u dont understand this part console.log(req.headers) in app.js
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are not logged in! Login to get access', 401));
  }

  //2) Verify token
  const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('the user belonging to this token does no longer exist', 401));
  }

  //4) check if user chamged password afther the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('user recently changed password! please log in again', 401));
  }

  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1) verify token
      const decoded = await util.promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

      //2) check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next(); // ✅ Return here
      }

      //3) check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(); // ✅ Return here
      }

      //4) there is a logged in user
      res.locals.user = currentUser;
      return next(); // ✅ Return here
    } catch (err) {
      return next(); // ✅ Return here
    }
  }
  next(); // ✅ Only called if no JWT cookie
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    maxAge: 0,
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};

exports.restrictedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('you do not have permission to perform this action', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user based on posted email
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) {
    return next(new AppError('There is no user with this email', 404));
  }

  //2) Generate a random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3) send this token to users mail
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(201).json({
      status: 'success',
      message: 'token is sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending the email. Try again', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get the user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2)if token has not expired and ther is a user , set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  //3) update changePasswordAt property
  //4)log the user in , send jwt
  const token = generateToken(user._id);
  res.status(200).json({
    status: 'User logged in succfully',
    token
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) get user form the collection
  const user = await User.findById(req.user.id).select('+password');

  //2) check if POSTED current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('incorrect password.Try again', 400));
  }

  //3) if so ,update password
  const newPassword = req.body.password;
  user.password = newPassword;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  //4) log user in , send JWT
  createSendToken(user, 200, res);
});
