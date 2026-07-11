const express = require("express");

const router = express.Router();

const organizationController = require(
  "../controllers/organization.controller"
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
} = require(
  "../middleware/orgAuth.middleware"
);

const {
  validateCreateOrganization,
} = require(
  "../validators/createOrganization.validator"
);

const {
  validateUpdateOrganization,
} = require(
  "../validators/updateOrganization.validator"
);

const {
  validateInviteMember,
} = require(
  "../validators/inviteMember.validator"
);

const {
  validateUpdateMemberRole,
} = require(
  "../validators/updateMemberRole.validator"
);

const {
  validateCreateJoinRequest,
  validateResolveJoinRequest,
} = require(
  "../validators/joinRequest.validator"
);

/*
|--------------------------------------------------------------------------
| Organization Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  validate(
    validateCreateOrganization
  ),
  asyncHandler(
    organizationController.createOrganization.bind(
      organizationController
    )
  )
);

router.get(
  "/:id",
  authenticate,
  checkOrgAccess(),
  asyncHandler(
    organizationController.getOrganization.bind(
      organizationController
    )
  )
);

router.put(
  "/:id",
  authenticate,
  checkOrgAccess(["org_admin"]),
  validate(
    validateUpdateOrganization
  ),
  asyncHandler(
    organizationController.updateOrganization.bind(
      organizationController
    )
  )
);

/*
|--------------------------------------------------------------------------
| Organization Members
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/members",
  authenticate,
  checkOrgAccess(),
  asyncHandler(
    organizationController.listMembers.bind(
      organizationController
    )
  )
);

router.post(
  "/:id/invite",
  authenticate,
  checkOrgAccess(["org_admin"]),
  validate(
    validateInviteMember
  ),
  asyncHandler(
    organizationController.inviteMember.bind(
      organizationController
    )
  )
);

router.patch(
  "/:id/members/:uid/role",
  authenticate,
  checkOrgAccess(["org_admin"]),
  validate(
    validateUpdateMemberRole
  ),
  asyncHandler(
    organizationController.updateMemberRole.bind(
      organizationController
    )
  )
);

router.delete(
  "/:id/members/:uid",
  authenticate,
  checkOrgAccess(["org_admin"]),
  asyncHandler(
    organizationController.removeMember.bind(
      organizationController
    )
  )
);

/*
|--------------------------------------------------------------------------
| Organization Invitations
|--------------------------------------------------------------------------
*/

router.get(
  "/invites/details",
  asyncHandler(
    organizationController.getInvitationDetails.bind(
      organizationController
    )
  )
);

router.post(
  "/invites/accept",
  authenticate,
  asyncHandler(
    organizationController.acceptInvitation.bind(
      organizationController
    )
  )
);

router.get(
  "/:id/invites",
  authenticate,
  checkOrgAccess(["org_admin"]),
  asyncHandler(
    organizationController.listInvitations.bind(
      organizationController
    )
  )
);

router.post(
  "/:id/invites",
  authenticate,
  checkOrgAccess(["org_admin"]),
  asyncHandler(
    organizationController.inviteMemberByEmail.bind(
      organizationController
    )
  )
);

router.delete(
  "/:id/invites/:invitationId",
  authenticate,
  checkOrgAccess(["org_admin"]),
  asyncHandler(
    organizationController.revokeInvitation.bind(
      organizationController
    )
  )
);

router.get(
  "/:id/activity",
  authenticate,
  checkOrgAccess(),
  asyncHandler(
    organizationController.getOrgActivity.bind(
      organizationController
    )
  )
);

/*
|--------------------------------------------------------------------------
| Join Requests
|--------------------------------------------------------------------------
*/

router.post(
  "/join-requests",
  authenticate,
  validate(validateCreateJoinRequest),
  asyncHandler(
    organizationController.createJoinRequest.bind(
      organizationController
    )
  )
);

router.get(
  "/join-requests/my-pending",
  authenticate,
  asyncHandler(
    organizationController.getMyPendingJoinRequest.bind(
      organizationController
    )
  )
);

router.delete(
  "/join-requests/:requestId",
  authenticate,
  asyncHandler(
    organizationController.cancelJoinRequest.bind(
      organizationController
    )
  )
);

router.get(
  "/:id/join-requests",
  authenticate,
  checkOrgAccess(["org_admin"]),
  asyncHandler(
    organizationController.listJoinRequests.bind(
      organizationController
    )
  )
);

router.patch(
  "/:id/join-requests/:requestId/resolve",
  authenticate,
  checkOrgAccess(["org_admin"]),
  validate(validateResolveJoinRequest),
  asyncHandler(
    organizationController.resolveJoinRequest.bind(
      organizationController
    )
  )
);

module.exports = router;