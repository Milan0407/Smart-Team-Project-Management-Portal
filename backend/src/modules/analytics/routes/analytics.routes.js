const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analytics.controller");
const authenticate = require("../../auth/middleware/authenticate.middleware");
const { checkOrgAccess } = require("../../org/middleware/orgAuth.middleware");
const { checkProjectAccess } = require("../../project/middleware/projectAuth.middleware");
const asyncHandler = require("../../../shared/middleware/asyncHandler.middleware");

/*
|--------------------------------------------------------------------------
| Analytics Routes
|--------------------------------------------------------------------------
*/
router.get(
  "/analytics/orgs/:orgId",
  authenticate,
  checkOrgAccess(),
  asyncHandler(analyticsController.getOrgStats.bind(analyticsController))
);

router.get(
  "/analytics/projects/:projectId",
  authenticate,
  checkProjectAccess(),
  asyncHandler(analyticsController.getProjectStats.bind(analyticsController))
);

router.get(
  "/analytics/projects/:projectId/workload",
  authenticate,
  checkProjectAccess(),
  asyncHandler(analyticsController.getProjectWorkload.bind(analyticsController))
);

module.exports = router;
