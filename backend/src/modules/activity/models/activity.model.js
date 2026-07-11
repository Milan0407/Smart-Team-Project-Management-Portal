const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Activity Schema
|--------------------------------------------------------------------------
| Captures every task mutation as an immutable audit trail entry.
*/
const activitySchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: ["created", "updated", "moved", "commented", "comment_deleted", "deleted"],
      required: true,
    },

    // Flexible context: { field, oldValue, newValue, comment, etc. }
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Optimise feed queries
activitySchema.index({ taskId: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
