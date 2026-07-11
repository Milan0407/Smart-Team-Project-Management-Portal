const Board = require("../models/board.model");

class BoardRepository {
  async create(data) {
    return Board.create(data);
  }

  async findById(id) {
    return Board.findById(id);
  }

  async findByProjectId(projectId) {
    return Board.find({ projectId, isActive: true });
  }

  async updateById(id, updateData, options = {}) {
    return Board.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      ...options,
    });
  }

  async deactivate(id) {
    return Board.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}

module.exports = new BoardRepository();
