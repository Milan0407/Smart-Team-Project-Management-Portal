const mongoose = require("mongoose");

const logger = require("./logger");
const env = require("./env");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      env.mongoUri
    );

    logger.info(
      `MongoDB Connected: ${conn.connection.host}`
    );
  } catch (error) {
    logger.error(
      `MongoDB Connection Error: ${error.message}`
    );

    process.exit(1);
  }
};

module.exports = connectDB;