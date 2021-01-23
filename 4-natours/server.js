const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/config.env` });
const connectDB = require('./config/db');

connectDB();

const app = require('./app');

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
