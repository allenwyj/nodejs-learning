class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Won't pollute the original error.stack,
    // when a new object is created.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
