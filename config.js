"use strict";
exports.DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://admin:admin1@ds219181.mlab.com:19181/blogpost-with-comments";
exports.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || "mongodb://localhost/test-blogposts";
exports.PORT = process.env.PORT || 8080;
