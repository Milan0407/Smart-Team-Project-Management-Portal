const mongoose = require("mongoose");
const auditPlugin = require("../../../shared/plugins/audit.plugin");

const projectMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["project_manager", "developer", "viewer"],
      default: "developer",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const projectSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 10,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: {
      type: [projectMemberSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
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
projectSchema.plugin(auditPlugin);

// Indexes
projectSchema.index({ orgId: 1 });
projectSchema.index({ orgId: 1, key: 1 }, { unique: true });
projectSchema.index({ leadId: 1 });
projectSchema.index({ "members.userId": 1 });
projectSchema.index({ isActive: 1 });
projectSchema.index({ name: "text", description: "text" });

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
