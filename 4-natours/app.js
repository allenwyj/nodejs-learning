const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// Setting up the View engine
app.set('view engine', 'pug');
// Define the location where to find the templates
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limiting no. of requests from the same IP
const limiter = rateLimit({
  max: 100, // 100 requests per IP
  windowMs: 3600000, // 1 hr
  message: 'Too many requests from your IP, please try again in an hour!',
});

// only applies to /api/xxx/xxx
app.use('/api', limiter);

// Body parser allows to access req.body data from the request
// It parses incoming requests with JSON payloads and is based on body-parser.
// body-parser: Parse incoming request bodies
app.use(express.json({ limit: '10kb' })); // limit within 10kb

// Data sanitisation against NoSQL query injection
app.use(mongoSanitize());

// Data sanitisation against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Test middleware
app.use((req, res, next) => {
  // add requestTime into request.
  req.requestTime = new Date().toISOString();
  next();
});

app.get('/', (req, res) => {
  // render the template with the template's name.
  // passing variables into pug file.
  res.status(200).render('base', {
    tour: 'The Forest Hiker',
    user: 'Allen',
  });
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// notFound handler
app.all('*', (req, res, next) => {
  // express will know it's passing an error,
  // so it will skip all routes except the error handler.
  next(new AppError(`Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

module.exports = app;
