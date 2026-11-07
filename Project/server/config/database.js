const mongoose = require("mongoose");

const getDatabaseName = () => {
  const environment = process.env.NODE_ENV || "development";

  if(environment === "production"){
    if(!process.env.MONGO_DB_PROD) throw new Error("MONGO_DB_PROD is missing.");
    
    return process.env.MONGO_DB_PROD;
  }

  if(environment === "development"){
    if(!process.env.MONGO_DB_DEV) throw new Error("MONGO_DB_DEV is missing.");

    return process.env.MONGO_DB_DEV
  }

  throw new Error(`Unsupported NODE_ENV: ${environment}`);
};

const connectDB = async () => {
  try {
    const databaseName = getDatabaseName();

    const conn = await mongoose.connect(process.env.MONGO_URI, {dbName: databaseName});

    console.log("--------------------------------");
    console.log("DATABASE CONNECTION");
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Host: ${conn.connection.host}`);
    console.log("--------------------------------");

    return conn;

  } catch (error) {
    throw new Error(
      `MongoDB connection failed: ${error.message}`
    );
  }
};

connectDB.getDatabaseName = getDatabaseName;

module.exports = connectDB;
