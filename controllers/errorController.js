// this file for Global Error handler middleware function
const AppError = require('../utils/appError');

const handleCastError = (err) => {
  const message = `invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFields = (err) => {
  const value = Object.values(err.keyValue)[0];
  const message = `Duplicate field value: ${value}. Use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const JWTInvalidToken = (err) => {
  return new AppError('Invalid token! please log in again', 401);
};

const JWTtokenExpired = (err) => {
  return new AppError('token expired! try again', 401);
};

// const sendErrorDev = (err, req, res) => {
//   // API
//   if (req.originalUrl.startsWith('/api')) {
//     res.status(err.statusCode).json({
//       status: err.status,
//       error: err,
//       message: err.message,
//       stack: err.stack
//     });
//   } else {
//     //Rendered Website
//     res.status(err.statusCode).render('error', {
//       title: 'something Went Wrong',
//       msg: err.message
//     });
//   }
// };

// const sendErrorProd = (err, req, res) => {
//   //API
//   if (req.originalUrl.startsWith('/api')) {
//     //operational trusted error: send message to client
//     if (err.isOperational) {
//       return res.status(err.statusCode).json({
//         status: err.status,
//         message: err.message
//       });

//       // Programming or other unkonwn error: dont leak error to client
//     }
//     //1) log error
//     console.error('Error Booom', err);
//     //2) send generic response
//     return res.status(500).json({
//       status: 'error',
//       message: 'sth went very wrong'
//     });
//   } else {
//     //Rendered Website
//     if (err.isOperational) {
//       return res.status(err.statusCode).render('error', {
//         title: 'something Went Wrong',
//         msg: err.message
//       });
//     }
//     //1) log error
//     console.error('Error Booom', err);
//     //2) send generic response
//     return res.status(err.statusCode).render('error', {
//       title: 'something Went Wrong',
//       msg: 'please try again later'
//     });
//   }
// };

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // B) RENDERED WEBSITE
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);

    if (error.name === 'CastError') {
      error = handleCastError(error);
    }
    if (error.code === 11000) {
      // dih msh sh8ala msh la2y err.code fel response bta3 postman
      error = handleDuplicateFields(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = JWTInvalidToken(error);
    }
    if (error.name === 'TokenExpiredError') {
      error = JWTtokenExpired(error);
    }
    sendErrorProd(error, req, res);
  }
};
