const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('../models/tourModel');

dotenv.config({ path: `${__dirname}/../config.env` });
const connectDB = require('../config/db');

connectDB();

// READ JSON FILE
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/data/tours.json`, 'utf-8')
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.insertMany(tours);
    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data Cleared!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '--d') {
  deleteData();
} else if (process.argv[2] === '--i') {
  importData();
}
