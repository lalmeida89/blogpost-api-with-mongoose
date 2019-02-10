"use strict";
exports.DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://admin:admin1@ds241677.mlab.com:41677/blogpostmongoose";
exports.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || "mongodb://localhost/test-blogposts";
exports.PORT = process.env.PORT || 8080;
