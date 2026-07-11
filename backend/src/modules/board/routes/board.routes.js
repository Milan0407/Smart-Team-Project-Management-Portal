const express = require("express");
const router = express.Router();

const boardController = require("../controllers/board.controller");
const authenticate = require("../../auth/middleware/authenticate.middleware");
const { checkProjectAccess, checkBoardAccess } = require("../../project/middleware/projectAuth.middleware");
const validate = require("../../../shared/middleware/validate.middleware");
const asyncHandler = require("../../../shared/middleware/asyncHandler.middleware");

const { validateCreateBoard } = require("../validators/createBoard.validator");
const { validateUpdateBoard } = require("../validators/updateBoard.validator");

/*
|--------------------------------------------------------------------------
| Project Boards
|--------------------------------------------------------------------------
*/

router.get(
  "/projects/:projectId/boards",
  authenticate,
  checkProjectAccess(),
  asyncHandler(boardController.getBoardsByProject.bind(boardController))
);

router.post(
  "/projects/:projectId/boards",
  authenticate,
  checkProjectAccess(["project_manager"]),
  validate(validateCreateBoard),
  asyncHandler(boardController.createBoard.bind(boardController))
);

/*
|--------------------------------------------------------------------------
| Board CRUD
|--------------------------------------------------------------------------
*/

router.get(
  "/boards/:id",
  authenticate,
  checkBoardAccess(),
  asyncHandler(boardController.getBoard.bind(boardController))
);

router.put(
  "/boards/:id",
  authenticate,
  checkBoardAccess(["project_manager"]),
  validate(validateUpdateBoard),
  asyncHandler(boardController.updateBoard.bind(boardController))
);

router.delete(
  "/boards/:id",
  authenticate,
  checkBoardAccess(["project_manager"]),
  asyncHandler(boardController.deleteBoard.bind(boardController))
);

module.exports = router;
