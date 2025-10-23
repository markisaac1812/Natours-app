const path = require('path');
const express = require('express');
const morgon = require('morgan'); // make apis calls appear in terminal their size method used
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const TourRouter = require('./routes/tourRoutes');
const UserRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const santizeBody = require('./utils/santizeReqBody');
const hpp = require('hpp');
const NoSQLSantize = require('./utils/NoSQLSantize');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bookingRouter = require('./routes/bookingRoutes');
const compression = require('compression');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//  global Middlewares
// app.use(cors({
//   origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
//   credentials: true
// }));
//1) Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// set security for http headers
app.use(helmet());

//Body parser,reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgon('dev'));
}

// for limiting no of req
const limiter = rateLimit({
  max: 5,
  windowMs: 60 * 60 * 1000,
  message: 'too many requests with this ip , try again in an hour'
});
app.use('/api', limiter);

//Data sanitizing against NoSQL query injection
app.use(NoSQLSantize);

//Data Sanitizing (putting js code attached to html code in scripts tag)
app.use(santizeBody);

//prevent parameter pollution (not allowing duplicates in query (sort,duration etc(sort=5&sort=9))
app.use(
  hpp({
    whitelist: ['duration']
  })
);

// In app.js, after helmet() and before routes
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com https://js.stripe.com; connect-src 'self' https://cdnjs.cloudflare.com https://js.stripe.com ws://localhost:62237; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; frame-src 'self' https://js.stripe.com;"
  );
  next();
});

app.use(compression());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

// ---------------------------
app.use('/', viewRouter);
app.use('/api/v1/tours', TourRouter);
app.use('/api/v1/users', UserRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Handle favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.all('/{*any}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} in the server`));
});

app.use(globalErrorHandler);

module.exports = app;
