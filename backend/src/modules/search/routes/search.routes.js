const express = require("express");
const router = express.Router();

const searchController = require("../controllers/search.controller");
const authenticate = require("../../auth/middleware/authenticate.middleware");
const asyncHandler = require("../../../shared/middleware/asyncHandler.middleware");

/*
|--------------------------------------------------------------------------
| Search Routes
|--------------------------------------------------------------------------
*/
router.get(
  "/search",
  authenticate,
  asyncHandler(searchController.globalSearch.bind(searchController))
);

module.exports = router;
