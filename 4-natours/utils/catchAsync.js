// The function that catchAsync() returns is the one which
// actually accetps req, res and next from the routes.
// catchAsync() will be called and returns another function,
// and this function will be called by express, then fn gets called.
const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch((err) => next(err));
};

module.exports = catchAsync;
