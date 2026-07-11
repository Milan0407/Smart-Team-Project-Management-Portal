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
  },
  {
    _id: false,
  }
);

const teamSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    members: {
      type: [memberSchema],
      default: [],
    },

    color: {
      type: String,
      trim: true,
      default: "#2563eb",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
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

teamSchema.plugin(auditPlugin);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

teamSchema.index({
  orgId: 1,
});

teamSchema.index({
  departmentId: 1,
});

teamSchema.index({
  leadId: 1,
});

teamSchema.index({
  "members.userId": 1,
});

teamSchema.index({
  isActive: 1,
});

/*
|--------------------------------------------------------------------------
| Unique Team Name Per Department
|--------------------------------------------------------------------------
*/

teamSchema.index(
  {
    departmentId: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

/*
|--------------------------------------------------------------------------
| Virtuals
|--------------------------------------------------------------------------
*/

teamSchema.virtual("memberCount").get(
  function () {
    return this.members?.length || 0;
  }
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Team = mongoose.model(
  "Team",
  teamSchema
);

module.exports = Team;