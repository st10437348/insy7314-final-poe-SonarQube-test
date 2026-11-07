require("dotenv").config();

module.exports = {
  mongodb: {
    url: process.env.MONGO_URI,
    databaseName: process.env.MONGO_DB_NAME
  },

  migrationsDir: "migrations",

  changelogCollectionName: "changelog",

  migrationFileExtension: ".js",

  useFileHash: false,

  moduleSystem: "commonjs"
};