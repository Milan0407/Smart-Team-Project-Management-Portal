const mongoose = require("mongoose");

const auditPlugin = require("../../../shared/plugins/audit.plugin");

const roleSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    scope: {
      type: String,
      enum: [
        "org",
        "department",
        "project",
      ],
      required: true,
    },

    permissions: {
      type: [String],
      default: [],
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

roleSchema.plugin(auditPlugin);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

roleSchema.index({
  orgId: 1,
  name: 1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Role = mongoose.model(
  "Role",
  roleSchema
);

module.exports = Role;