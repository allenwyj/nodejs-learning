const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));

  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// allows to access req.body data from the request
// It parses incoming requests with JSON payloads and is based on body-parser.
// body-parser: Parse incoming request bodies
app.use(express.json());

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
  // so it will skip all routes instead of the error handler.
  next(new AppError(`Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

module.exports = app;
