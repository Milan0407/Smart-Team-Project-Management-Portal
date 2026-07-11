const express = require("express");

const router = express.Router();

const departmentController = require(
  "../controllers/department.controller"
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
  checkDeptAccess,
} = require("../../org/middleware/orgAuth.middleware");

const {
  validateCreateDepartment,
} = require(
  "../validators/createDepartment.validator"
);

const {
  validateUpdateDepartment,
} = require(
  "../validators/updateDepartment.validator"
);

const {
  validateAddDepartmentMember,
} = require(
  "../validators/addDepartmentMember.validator"
);

const {
  validateAssignDepartmentManager,
} = require(
  "../validators/assignDepartmentManager.validator"
);

/*
|--------------------------------------------------------------------------
| Organization Departments
|--------------------------------------------------------------------------
*/

router.get(
  "/orgs/:orgId/departments",
  authenticate,
  checkOrgAccess(),
  asyncHandler(
    departmentController.getDepartmentsByOrg.bind(
      departmentController
    )
  )
);

router.post(
  "/orgs/:orgId/departments",
  authenticate,
  checkOrgAccess(["org_admin"]),
  validate(
    validateCreateDepartment
  ),
  asyncHandler(
    departmentController.createDepartment.bind(
      departmentController
    )
  )
);

/*
|--------------------------------------------------------------------------
| Department CRUD
|--------------------------------------------------------------------------
*/

router.get(
  "/departments/:id",
  authenticate,
  checkDeptAccess([], true),
  asyncHandler(
    departmentController.getDepartment.bind(
      departmentController
    )
  )
);

router.put(
  "/departments/:id",
  authenticate,
  checkDeptAccess(["org_admin"], true),
  validate(
    validateUpdateDepartment
  ),
  asyncHandler(
    departmentController.updateDepartment.bind(
      departmentController
    )
  )
);

router.delete(
  "/departments/:id",
  authenticate,
  checkDeptAccess(["org_admin"]),
  asyncHandler(
    departmentController.deleteDepartment.bind(
      departmentController
    )
  )
);

/*
|--------------------------------------------------------------------------
| Department Members
|--------------------------------------------------------------------------
*/

router.post(
  "/departments/:id/members",
  authenticate,
  checkDeptAccess(["org_admin"], true),
  validate(
    validateAddDepartmentMember
  ),
  asyncHandler(
    departmentController.addMember.bind(
      departmentController
    )
  )
);

router.delete(
  "/departments/:id/members/:uid",
  authenticate,
  checkDeptAccess(["org_admin"], true),
  asyncHandler(
    departmentController.removeMember.bind(
      departmentController
    )
  )
);

/*
|--------------------------------------------------------------------------
| Department Manager
|--------------------------------------------------------------------------
*/

router.patch(
  "/departments/:id/manager",
  authenticate,
  checkDeptAccess(["org_admin"]),
  validate(
    validateAssignDepartmentManager
  ),
  asyncHandler(
    departmentController.assignManager.bind(
      departmentController
    )
  )
);

module.exports = router;