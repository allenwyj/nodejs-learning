const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // get keys in err.keyValue, it might change due to different field name in schema.
  const value = err.keyValue[Object.keys(err.keyValue)[0]];

  const message = `Duplicate field value: "${value}". Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please try to log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token expired! Please try to log in again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Only send error message if it is not caused by operational error.
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Non-operational error handler
    // Programming or other unknown error: don't leak error details.
  } else {
    // 1) Log error
    console.error('ERROR', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong.',
    });
  }
};

// By specifying four parameters, express.js will know it is the error handler.
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Mongoose cast error: invalid ObjectId
    if (err.name === 'CastError') err = handleCastErrorDB(err);

    // Mongoose duplicate key/fields error
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);

    // Mongoose validation error
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);

    // Handle JWT invalid token error
    if (err.name === 'JsonWebTokenError') err = handleJWTError();

    // Handle JWT expired token error
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();

    sendErrorProd(err, res);
  }
};

module.exports = globalErrorHandler;
