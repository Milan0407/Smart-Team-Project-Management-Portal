const boardRepository = require("../repositories/board.repository");
const projectRepository = require("../../project/repositories/project.repository");
const socketManager = require("../../../sockets/socket.manager");
const NotFoundError = require("../../../shared/errors/NotFoundError");

class BoardService {
  async createBoard(projectId, data, currentUserId) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return boardRepository.create({
      projectId,
      name: data.name,
      columns: data.columns || [
        { name: "To Do", order: 0, color: "#3b82f6" },
        { name: "In Progress", order: 1, color: "#f59e0b" },
        { name: "Done", order: 2, color: "#10b981" },
      ],
      createdBy: currentUserId,
      updatedBy: currentUserId,
    });
  }

  async getBoardById(id) {
    const board = await boardRepository.findById(id);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    return board;
  }

  async getBoardsByProject(projectId) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return boardRepository.findByProjectId(projectId);
  }

  async updateBoard(id, updateData, currentUserId) {
    const board = await boardRepository.findById(id);
    if (!board) {
      throw new NotFoundError("Board not found");
    }

    const updated = await boardRepository.updateById(id, {
      ...updateData,
      updatedBy: currentUserId,
    });

    // Broadcast board column updates to sockets
    socketManager.toProject(board.projectId.toString(), "board:updated", {
      projectId: board.projectId,
      boardId: id,
      action: "columns:updated",
    });

    return updated;
  }

  async deleteBoard(id) {
    const board = await boardRepository.findById(id);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    return boardRepository.deactivate(id);
  }
}

module.exports = new BoardService();
