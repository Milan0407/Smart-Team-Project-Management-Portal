const mongoose = require("mongoose");
const ROLES = require("../../../shared/constants/roles.constants");

const joinRequestSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
joinRequestSchema.index({ orgId: 1, status: 1 });
joinRequestSchema.index({ userId: 1, status: 1 });
// Unique constraint on pending request to prevent duplicates
joinRequestSchema.index({ orgId: 1, userId: 1, status: 1 });

const JoinRequest = mongoose.model("JoinRequest", joinRequestSchema);

module.exports = JoinRequest;
