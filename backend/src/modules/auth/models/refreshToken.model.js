const mongoose = require("mongoose");

const refreshTokenSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      tokenHash: {
  type: String,
  required: true,
  select: false,
},

      deviceInfo: {
        userAgent: {
          type: String,
          default: null,
        },

        deviceType: {
          type: String,
          default: null,
        },

        deviceName: {
          type: String,
          default: null,
        },
      },

      ipAddress: {
        type: String,
        default: null,
      },

      expiresAt: {
        type: Date,
        required: true,
      },

      revoked: {
        type: Boolean,
        default: false,
      },

      revokedAt: {
        type: Date,
        default: null,
      },

      revokedReason: {
        type: String,
        enum: [
          "logout",
          "security",
          "admin",
          "expired",
        ],
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

/*
|--------------------------------------------------------------------------
| Compound Index
|--------------------------------------------------------------------------
*/

refreshTokenSchema.index({
  userId: 1,
  revoked: 1,
});

/*
|--------------------------------------------------------------------------
| TTL Index
|--------------------------------------------------------------------------
*/

refreshTokenSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

  refreshTokenSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.tokenHash;
    delete ret.__v;

    return ret;
  },
});

const RefreshToken =
  mongoose.model(
    "RefreshToken",
    refreshTokenSchema
  );



module.exports =
  RefreshToken;