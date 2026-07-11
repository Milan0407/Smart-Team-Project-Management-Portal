const mongoose = require("mongoose");
const auditPlugin = require("../../../shared/plugins/audit.plugin");

/*
|--------------------------------------------------------------------------
| Comment Sub-Schema
|--------------------------------------------------------------------------
*/
const commentSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true, // comments need their own _id for deletion
  }
);

/*
|--------------------------------------------------------------------------
| Attachment Sub-Schema
|--------------------------------------------------------------------------
*/
const attachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true, // attachments need their own _id for deletion
  }
);

/*
|--------------------------------------------------------------------------
| Task Schema
|--------------------------------------------------------------------------
*/
const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      default: null,
      index: true,
    },

    // Column is stored by name — columns are embedded in Board, no separate collection
    columnName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },

    status: {
      type: String,
      enum: ["todo", "in_progress", "in_review", "done", "cancelled"],
      default: "todo",
      index: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },

    // Within-column ordering index
    order: {
      type: Number,
      default: 0,
      index: true,
    },

    comments: {
      type: [commentSchema],
      default: [],
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, priority: 1 });
taskSchema.index({ boardId: 1, columnName: 1, order: 1 });
taskSchema.index({ assigneeId: 1, isActive: 1 });
taskSchema.index({ title: "text", description: "text" });

taskSchema.plugin(auditPlugin);

taskSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
