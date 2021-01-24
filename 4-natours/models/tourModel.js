const mongoose = require('mongoose');

// Create schema
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a name'],
    unique: true,
  },
  ratingsAverage: { type: Number, default: 4.5 },
  ratingsQuantity: { type: Number, default: 0 },
  price: { type: Number, required: [true, 'A tour must have a price'] },
  priceDiscount: Number,
  duration: { type: Number, required: [true, 'A tour must have a duration'] },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    trim: true,
  },
  summary: {
    type: String,
    required: [true, 'A tour must have a summary'],
    trim: true, // removes whitespace from both ends of a string
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false, // hides from the output.
  },
  startDates: [Date],
});

// Create model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
