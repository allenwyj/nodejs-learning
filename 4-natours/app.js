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

const app = express();

// GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));

  app.get('/', (req, res) => {
    res.send('API is running...');
  });
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

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// notFound handler
app.all('*', (req, res, next) => {
  // express will know it's passing an error,
  // so it will skip all routes except the error handler.
  next(new AppError(`Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

module.exports = app;
