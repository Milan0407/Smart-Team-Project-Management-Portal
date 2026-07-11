const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const auditPlugin = require("../../../shared/plugins/audit.plugin");

const orgMembershipSchema =
  new mongoose.Schema(
    {
      orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
      },

      role: {
        type: String,
        required: true,
      },
    },
    {
      _id: false,
    }
  );

const preferenceSchema =
  new mongoose.Schema(
    {
      theme: {
        type: String,
        default: "light",
      },

      locale: {
        type: String,
        default: "en",
      },

      timezone: {
        type: String,
        default: "UTC",
      },
    },
    {
      _id: false,
    }
  );

const notificationSettingsSchema = new mongoose.Schema(
  {
    taskAssigned: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    commentMention: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    wikiUpdated: {
      email: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
    },
  },
  {
    _id: false,
  }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    avatar: {
      type: String,
      default: null,
    },

    orgMemberships: {
      type: [orgMembershipSchema],
      default: [],
    },

    preferences: {
      type: preferenceSchema,
      default: () => ({}),
    },

    notificationSettings: {
      type: notificationSettingsSchema,
      default: () => ({}),
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(auditPlugin);

userSchema.pre(
  "save",
  async function () {
    if (
      !this.isModified(
        "passwordHash"
      )
    ) {
      return;
    }

    this.passwordHash =
      await bcrypt.hash(
        this.passwordHash,
        12
      );
  }
);

userSchema.methods.comparePassword =
  async function (candidatePassword) {
    return bcrypt.compare(
      candidatePassword,
      this.passwordHash
    );
  };

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;

    return ret;
  },
});

const User = mongoose.model(
  "User",
  userSchema
);

module.exports = User;