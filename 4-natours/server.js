const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/config.env` });

// Uncaught exception
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION ERROR. Shutting down...');
  console.log(err.name, err.message);

  process.exit(1);
});

const connectDB = require('./config/db');

connectDB();

const app = require('./app');

// START SERVER
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Unhandled Rejection: such as unhandle promise error while connecting DB
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION ERROR. Shutting down...');
  console.log(err.name, err.message);

  // giving server time to finish other processes and shut down.
  server.close(() => {
    process.exit(1);
  });
});
