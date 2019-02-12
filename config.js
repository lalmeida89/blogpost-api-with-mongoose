"use strict";
exports.DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://localhost/blogpost-with-comments";
exports.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || "mongodb://localhost/test-blogpost-with-comments";
exports.PORT = process.env.PORT || 8080;
