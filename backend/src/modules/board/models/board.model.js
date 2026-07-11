const mongoose = require("mongoose");
const auditPlugin = require("../../../shared/plugins/audit.plugin");

const boardColumnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      default: "#cbd5e1", // Default slate color
    },
  },
  {
    _id: false,
  }
);

const boardSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    columns: {
      type: [boardColumnSchema],
      default: [
        { name: "To Do", order: 0, color: "#3b82f6" },
        { name: "In Progress", order: 1, color: "#f59e0b" },
        { name: "Done", order: 2, color: "#10b981" },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Plugins
boardSchema.plugin(auditPlugin);

// Indexes
boardSchema.index({ projectId: 1 });
boardSchema.index({ isActive: 1 });

const Board = mongoose.model("Board", boardSchema);

module.exports = Board;
