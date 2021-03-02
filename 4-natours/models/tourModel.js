const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');

// Create schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxlength: [40, 'A tour name cannot be over 40 charactoers'],
      minlength: [10, 'A tour name must be more than 10 charactoers'],
    },
    slug: String,
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'Discount price ({VALUE}) cannot be over regular price',
        validator: function (val) {
          // this points to the current document
          // false will trigger a validator error
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
      },
    },
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      trim: true,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
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
      default: Date.now,
      select: false, // hides from the output.
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // Specifying this is a GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // embedded locations
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    // show virtual properties
    toJSON: { virtuals: true }, // when output json data each time
    toObject: { virtuals: true }, // when output object data each time
  }
);

/*
// pre-save hook
tourSchema.pre('save', (next) => {
  console.log('Will save document...');
  next();
});

// runs after .save() and .create()
// post-save middleware has document and next as the parameters in the cb.
tourSchema.post('save', (doc, next) => {
  console.log(doc);
  next();
});

// post-find middleware passes the documents into the cb,
// where the documents are the outcome after the query executed
tourSchema.post(/^find/, (docs, next) => {
  console.log(docs);
  next();
});
 */

// create a virtual property
tourSchema.virtual('durationWeeks').get(function () {
  // this points to the current document
  return this.duration / 7;
});

// Virtual Populate:
// foreignField - the foreign key in the Review model
// localField - the primary key in the Tour model
// Just like the way in MySQL
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // FK
  localField: '_id', // PK
});

// DOCUMENT MIDDLEWARE:
// runs before .save() and .create()
// pre-save middleware has next as the parameter in the cb.
tourSchema.pre('save', function (next) {
  // create and convert this.name to lowercase slug
  this.slug = slugify(this.name, { lower: true });
  next();
});

// embedding guides into a tour.
// tourSchema.pre('save', async function (next) {
//   // returning promises
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));

//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// QUERY MIDDLEWARE:
// executes before the .find() query excutes
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// Expanding guides field - so it will use the reference to query back
// the details of guides, excluding __v and passwordChangeAt fields.
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangeAt',
  });

  next();
});

// Calculating the time for querying.
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  // this points to the aggregate object, and we focus on
  // the aggregate pipeline object, and add the new match into the start of array.
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// Create model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
