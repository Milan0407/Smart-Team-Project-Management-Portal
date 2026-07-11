const express = require("express");
const router = express.Router();

const projectController = require("../controllers/project.controller");
const authenticate = require("../../auth/middleware/authenticate.middleware");
const { checkOrgAccess } = require("../../org/middleware/orgAuth.middleware");
const { checkProjectAccess } = require("../middleware/projectAuth.middleware");
const validate = require("../../../shared/middleware/validate.middleware");
const asyncHandler = require("../../../shared/middleware/asyncHandler.middleware");

const { validateCreateProject } = require("../validators/createProject.validator");
const { validateUpdateProject } = require("../validators/updateProject.validator");
const {
  validateAddProjectMember,
  validateUpdateProjectMemberRole,
} = require("../validators/projectMember.validator");

/*
|--------------------------------------------------------------------------
| Organization Projects
|--------------------------------------------------------------------------
*/

router.get(
  "/orgs/:orgId/projects",
  authenticate,
  checkOrgAccess(),
  asyncHandler(projectController.getProjectsByOrg.bind(projectController))
);

router.post(
  "/orgs/:orgId/projects",
  authenticate,
  checkOrgAccess(["org_admin"]),
  validate(validateCreateProject),
  asyncHandler(projectController.createProject.bind(projectController))
);

/*
|--------------------------------------------------------------------------
| Project CRUD
|--------------------------------------------------------------------------
*/

router.get(
  "/projects/:id",
  authenticate,
  checkProjectAccess(),
  asyncHandler(projectController.getProject.bind(projectController))
);

router.put(
  "/projects/:id",
  authenticate,
  checkProjectAccess(["project_manager"]),
  validate(validateUpdateProject),
  asyncHandler(projectController.updateProject.bind(projectController))
);

router.delete(
  "/projects/:id",
  authenticate,
  checkProjectAccess(["project_manager"]),
  asyncHandler(projectController.deleteProject.bind(projectController))
);

/*
|--------------------------------------------------------------------------
| Project Members
|--------------------------------------------------------------------------
*/

router.get(
  "/projects/:id/members",
  authenticate,
  checkProjectAccess(),
  asyncHandler(projectController.listMembers.bind(projectController))
);

router.post(
  "/projects/:id/members",
  authenticate,
  checkProjectAccess(["project_manager"]),
  validate(validateAddProjectMember),
  asyncHandler(projectController.addMember.bind(projectController))
);

router.patch(
  "/projects/:id/members/:uid/role",
  authenticate,
  checkProjectAccess(["project_manager"]),
  validate(validateUpdateProjectMemberRole),
  asyncHandler(projectController.updateMemberRole.bind(projectController))
);

router.delete(
  "/projects/:id/members/:uid",
  authenticate,
  checkProjectAccess(["project_manager"]),
  asyncHandler(projectController.removeMember.bind(projectController))
);

module.exports = router;
