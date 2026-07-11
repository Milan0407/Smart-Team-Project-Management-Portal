const mongoose = require("mongoose");

const auditPlugin = require(
  "../../../shared/plugins/audit.plugin"
);

const ROLES = require(
  "../../../shared/constants/roles.constants"
);

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
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

const departmentSchema =
  new mongoose.Schema(
    {
      orgId: {
        type:
          mongoose.Schema.Types.ObjectId,
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

      description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },

      managerId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      members: {
        type: [memberSchema],
        default: [],
      },

      parentDeptId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Department",
        default: null,
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

/*
|--------------------------------------------------------------------------
| Plugins
|--------------------------------------------------------------------------
*/

departmentSchema.plugin(
  auditPlugin
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

departmentSchema.index({
  orgId: 1,
});

departmentSchema.index({
  managerId: 1,
});

departmentSchema.index({
  parentDeptId: 1,
});

departmentSchema.index({
  "members.userId": 1,
});

departmentSchema.index({
  isActive: 1,
});

/*
|--------------------------------------------------------------------------
| Virtuals
|--------------------------------------------------------------------------
*/

departmentSchema.virtual(
  "memberCount"
).get(function () {
  return this.members?.length || 0;
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Department =
  mongoose.model(
    "Department",
    departmentSchema
  );

module.exports = Department;