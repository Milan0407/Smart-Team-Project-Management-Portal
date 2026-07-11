const express = require("express");

const router = express.Router();

const sessionController = require(
  "../controllers/session.controller"
);

const authenticate = require(
  "../middleware/authenticate.middleware"
);

const asyncHandler = require(
  "../../../shared/middleware/asyncHandler.middleware"
);

router.post(
  "/logout",
  authenticate,
  asyncHandler(
    sessionController.logout.bind(
      sessionController
    )
  )
);

router.post(
  "/logout-all",
  authenticate,
  asyncHandler(
    sessionController.logoutAll.bind(
      sessionController
    )
  )
);

router.get(
  "/sessions",
  authenticate,
  asyncHandler(
    sessionController.getSessions.bind(
      sessionController
    )
  )
);

router.delete(
  "/sessions/:sessionId",
  authenticate,
  asyncHandler(
    sessionController.revokeSession.bind(
      sessionController
    )
  )
);

module.exports = router;