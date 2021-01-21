const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// MIDDLEWARES
app.use(morgan('dev'));

// allows to access req.body data from the request
// It parses incoming requests with JSON payloads and is based on body-parser.
// body-parser: Parse incoming request bodies
app.use(express.json());

// defining the custom middleware
app.use((req, res, next) => {
  console.log('Middleware here!');
  next();
});

app.use((req, res, next) => {
  // add requestTime into request.
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
