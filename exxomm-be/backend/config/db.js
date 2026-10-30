require('dotenv').config()

const mongoose = require('mongoose');

const buildUriFromParts = () => {
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const dbName = process.env.MONGO_DB_NAME;
  const host = process.env.MONGO_HOST || 'mongo';
  const port = process.env.MONGO_PORT || '27017';

  return `mongodb://${user}:${pass}@${host}:${port}/${dbName}?authSource=admin`;
};

const connectDB = async () => {
  // MONGO_URI takes priority when set (e.g. a managed/external Mongo endpoint
  // injected via AWS SSM for a given environment). Otherwise the URI is
  // built from the discrete MONGO_USER/MONGO_PASS/MONGO_DB_NAME/MONGO_HOST
  // parts, which is what docker-compose.yml supplies to the backend service.
  const uri = process.env.MONGO_URI || buildUriFromParts();

  console.log("-----------------------------------------");
  console.log("ATTEMPTING DATABASE CONNECTION...");
  console.log("Connecting with source:", process.env.MONGO_URI ? 'MONGO_URI' : `${process.env.MONGO_HOST || 'mongo'}:${process.env.MONGO_PORT || '27017'}`);
  console.log("-----------------------------------------");

  try {
    const conn = await mongoose.connect(uri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection FAIL : `, err);
    process.exit(1);
  }
};

module.exports = {connectDB};
