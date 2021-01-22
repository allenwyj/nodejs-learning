const mongoose = require('mongoose');

// Create schema
const tourSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name required'], unique: true },
  rating: { type: Number, default: 4.5 },
  price: { type: Number, required: [true, 'Price required'] },
});

// Create model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
