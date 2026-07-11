const mongoose = require("mongoose");

const auditPlugin = require("../../../shared/plugins/audit.plugin");

const ROLES = require("../../../shared/constants/roles.constants");

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

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },

    settings: {
      branding: {
        logo: {
          type: String,
          default: "",
        },

        primaryColor: {
          type: String,
          default: "#2563eb",
        },
      },

      features: {
        projects: {
          type: Boolean,
          default: true,
        },

        chat: {
          type: Boolean,
          default: true,
        },

        documents: {
          type: Boolean,
          default: true,
        },
      },
    },

    members: {
      type: [memberSchema],
      default: [],
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

organizationSchema.plugin(auditPlugin);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

organizationSchema.index({
  ownerId: 1,
});

organizationSchema.index({
  "members.userId": 1,
});

organizationSchema.index({
  isActive: 1,
});

/*
|--------------------------------------------------------------------------
| Virtuals
|--------------------------------------------------------------------------
*/

organizationSchema.virtual(
  "memberCount"
).get(function () {
  return this.members?.length || 0;
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Organization = mongoose.model(
  "Organization",
  organizationSchema
);

module.exports = Organization;