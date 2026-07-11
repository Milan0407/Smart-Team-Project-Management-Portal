const express = require("express");

const router = express.Router();

const teamController = require(
  "../controllers/team.controller"
);

const authenticate = require(
  "../../auth/middleware/authenticate.middleware"
);

const validate = require(
  "../../../shared/middleware/validate.middleware"
);

const asyncHandler = require(
  "../../../shared/middleware/asyncHandler.middleware"
);

const {
  checkOrgAccess,
  checkTeamAccess,
} = require("../../org/middleware/orgAuth.middleware");

const {
  validateCreateTeam,
} = require(
  "../validators/createTeam.validator"
);

const {
  validateUpdateTeam,
} = require(
  "../validators/updateTeam.validator"
);

const {
  validateAddTeamMember,
} = require(
  "../validators/addTeamMember.validator"
);

const {
  validateAssignTeamLead,
} = require(
  "../validators/assignTeamLead.validator"
);

/*
|--------------------------------------------------------------------------
| Organization Teams
|--------------------------------------------------------------------------
*/

router.get(
  "/orgs/:orgId/teams",
  authenticate,
  checkOrgAccess(),
  asyncHandler(
    teamController.getTeamsByOrg.bind(
      teamController
    )
  )
);

router.post(
  "/orgs/:orgId/teams",
  authenticate,
  checkOrgAccess(["org_admin"]),
  validate(
    validateCreateTeam
  ),
  asyncHandler(
    teamController.createTeam.bind(
      teamController
    )
  )
);

/*
|--------------------------------------------------------------------------
| Team CRUD
|--------------------------------------------------------------------------
*/

router.get(
  "/teams/:id",
  authenticate,
  checkTeamAccess([], true, true),
  asyncHandler(
    teamController.getTeam.bind(
      teamController
    )
  )
);

router.put(
  "/teams/:id",
  authenticate,
  checkTeamAccess(["org_admin"], true, true),
  validate(
    validateUpdateTeam
  ),
  asyncHandler(
    teamController.updateTeam.bind(
      teamController
    )
  )
);

router.delete(
  "/teams/:id",
  authenticate,
  checkTeamAccess(["org_admin"], false, true),
  asyncHandler(
    teamController.deleteTeam.bind(
      teamController
    )
  )
);

/*
|--------------------------------------------------------------------------
| Team Members
|--------------------------------------------------------------------------
*/

router.post(
  "/teams/:id/members",
  authenticate,
  checkTeamAccess(["org_admin"], true, true),
  validate(
    validateAddTeamMember
  ),
  asyncHandler(
    teamController.addMember.bind(
      teamController
    )
  )
);

router.delete(
  "/teams/:id/members/:uid",
  authenticate,
  checkTeamAccess(["org_admin"], true, true),
  asyncHandler(
    teamController.removeMember.bind(
      teamController
    )
  )
);

/*
|--------------------------------------------------------------------------
| Team Lead
|--------------------------------------------------------------------------
*/

router.patch(
  "/teams/:id/lead",
  authenticate,
  checkTeamAccess(["org_admin"], false, true),
  validate(
    validateAssignTeamLead
  ),
  asyncHandler(
    teamController.assignLead.bind(
      teamController
    )
  )
);

module.exports = router;