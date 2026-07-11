const express = require("express");
const router = express.Router();

const taskController = require("../controllers/task.controller");
const authenticate = require("../../auth/middleware/authenticate.middleware");
const { checkProjectAccess } = require("../../project/middleware/projectAuth.middleware");
const { checkBoardAccess } = require("../../project/middleware/projectAuth.middleware");
const { checkTaskAccess } = require("../middleware/taskAuth.middleware");
const validate = require("../../../shared/middleware/validate.middleware");
const asyncHandler = require("../../../shared/middleware/asyncHandler.middleware");
const upload = require("../../../shared/middleware/upload.middleware");

const { validateCreateTask } = require("../validators/createTask.validator");
const { validateUpdateTask } = require("../validators/updateTask.validator");
const { validateMoveTask } = require("../validators/moveTask.validator");

/*
|--------------------------------------------------------------------------
| Project Tasks — scoped under /projects/:projectId
|--------------------------------------------------------------------------
*/

router.get(
  "/projects/:projectId/tasks",
  authenticate,
  checkProjectAccess(),
  asyncHandler(taskController.getTasksByProject.bind(taskController))
);

router.get(
  "/projects/:projectId/tasks/export",
  authenticate,
  checkProjectAccess(),
  asyncHandler(taskController.exportTasksToCSV.bind(taskController))
);

router.post(
  "/projects/:projectId/tasks",
  authenticate,
  checkProjectAccess(["project_manager", "developer"]),
  validate(validateCreateTask),
  asyncHandler(taskController.createTask.bind(taskController))
);

/*
|--------------------------------------------------------------------------
| Board Tasks — scoped under /boards/:boardId
|--------------------------------------------------------------------------
*/

router.get(
  "/boards/:boardId/tasks",
  authenticate,
  checkBoardAccess(),
  asyncHandler(taskController.getTasksByBoard.bind(taskController))
);

/*
|--------------------------------------------------------------------------
| Task CRUD — /tasks/:id
|--------------------------------------------------------------------------
*/

router.get(
  "/tasks/:id",
  authenticate,
  checkTaskAccess(),
  asyncHandler(taskController.getTask.bind(taskController))
);

router.put(
  "/tasks/:id",
  authenticate,
  checkTaskAccess(["project_manager", "developer"]),
  validate(validateUpdateTask),
  asyncHandler(taskController.updateTask.bind(taskController))
);

router.patch(
  "/tasks/:id/move",
  authenticate,
  checkTaskAccess(["project_manager", "developer"]),
  validate(validateMoveTask),
  asyncHandler(taskController.moveTask.bind(taskController))
);

router.delete(
  "/tasks/:id",
  authenticate,
  checkTaskAccess(["project_manager"]),
  asyncHandler(taskController.deleteTask.bind(taskController))
);

/*
|--------------------------------------------------------------------------
| Comments — /tasks/:id/comments
|--------------------------------------------------------------------------
*/

router.post(
  "/tasks/:id/comments",
  authenticate,
  checkTaskAccess(),
  asyncHandler(taskController.addComment.bind(taskController))
);

router.delete(
  "/tasks/:taskId/comments/:commentId",
  authenticate,
  checkTaskAccess(),
  asyncHandler(taskController.removeComment.bind(taskController))
);

/*
|--------------------------------------------------------------------------
| Activity Feed — /tasks/:id/activity
|--------------------------------------------------------------------------
*/

router.get(
  "/tasks/:id/activity",
  authenticate,
  checkTaskAccess(),
  asyncHandler(taskController.getTaskActivity.bind(taskController))
);

/*
|--------------------------------------------------------------------------
| Attachments — /tasks/:id/attachments
|--------------------------------------------------------------------------
*/

router.post(
  "/tasks/:id/attachments",
  authenticate,
  checkTaskAccess(["project_manager", "developer"]),
  upload.single("file"),
  asyncHandler(taskController.addAttachment.bind(taskController))
);

router.delete(
  "/tasks/:taskId/attachments/:attachmentId",
  authenticate,
  checkTaskAccess(["project_manager", "developer"]),
  asyncHandler(taskController.removeAttachment.bind(taskController))
);

module.exports = router;
