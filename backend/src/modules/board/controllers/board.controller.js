const boardService = require("../services/board.service");
const ApiResponse = require("../../../shared/utils/ApiResponse");

class BoardController {
  async createBoard(req, res) {
    const board = await boardService.createBoard(
      req.params.projectId,
      req.body,
      req.user.id
    );

    return res.status(201).json(
      new ApiResponse({
        message: "Board created successfully",
        data: board,
      })
    );
  }

  async getBoard(req, res) {
    // Board is pre-loaded and authorized in req.board by checkBoardAccess middleware
    return res.json(
      new ApiResponse({
        message: "Board fetched successfully",
        data: req.board,
      })
    );
  }

  async getBoardsByProject(req, res) {
    const boards = await boardService.getBoardsByProject(req.params.projectId);

    return res.json(
      new ApiResponse({
        message: "Boards fetched successfully",
        data: boards,
      })
    );
  }

  async updateBoard(req, res) {
    const board = await boardService.updateBoard(
      req.params.id,
      req.body,
      req.user.id
    );

    return res.json(
      new ApiResponse({
        message: "Board updated successfully",
        data: board,
      })
    );
  }

  async deleteBoard(req, res) {
    await boardService.deleteBoard(req.params.id);

    return res.json(
      new ApiResponse({
        message: "Board deleted successfully",
      })
    );
  }
}

module.exports = new BoardController();
