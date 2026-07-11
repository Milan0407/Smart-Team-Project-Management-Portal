const userRepository = require(
  "../repositories/user.repository"
);

const refreshTokenRepository = require(
  "../repositories/refreshToken.repository"
);

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/token.util");

const {
  hashValue,
  compareHash,
} = require("../utils/hash.util");

const AuthError = require(
  "../../../shared/errors/AuthError"
);

const ConflictError = require(
  "../../../shared/errors/ConflictError"
);

const NotFoundError = require(
  "../../../shared/errors/NotFoundError"
);

class AuthService {
  async register({
  name,
  email,
  password,
},
sessionMeta
) {
  const exists =
    await userRepository.existsByEmail(
      email
    );

  if (exists) {
    throw new ConflictError(
      "Email already registered"
    );
  }

  const user =
    await userRepository.create({
      name,
      email,
      passwordHash: password,
    });

  const payload = {
    id: user._id,
    email: user.email,
  };

  const accessToken =
    generateAccessToken(payload);

  const refreshToken =
    generateRefreshToken(payload);

  const tokenHash =
    await hashValue(refreshToken);

await refreshTokenRepository.create({
  userId: user._id,
  tokenHash,

  deviceInfo: {
    userAgent:
      sessionMeta?.deviceInfo
        ?.userAgent || null,
  },

  ipAddress:
    sessionMeta?.ipAddress ||
    null,

  expiresAt: new Date(
    Date.now() +
      30 * 24 * 60 * 60 * 1000
  ),
});

  return {
    user,
    accessToken,
    refreshToken,
  };
}

  async login({
  email,
  password,
},
sessionMeta
) {
  const user =
    await userRepository.findByEmailWithPassword(
      email
    );

  if (!user) {
    throw new AuthError(
      "Invalid credentials"
    );
  }
  if (!user.isActive) {
  throw new AuthError(
    "Account is disabled"
  );
}

  const valid =
    await user.comparePassword(
      password
    );

  if (!valid) {
    throw new AuthError(
      "Invalid credentials"
    );
  }

  const payload = {
    id: user._id,
    email: user.email,
  };

  const accessToken =
    generateAccessToken(payload);

  const refreshToken =
    generateRefreshToken(payload);

  const tokenHash =
    await hashValue(refreshToken);

await refreshTokenRepository.create({
  userId: user._id,
  tokenHash,

  deviceInfo: {
    userAgent:
      sessionMeta?.deviceInfo
        ?.userAgent || null,
  },

  ipAddress:
    sessionMeta?.ipAddress ||
    null,

    expiresAt: new Date(
    Date.now() +
      30 * 24 * 60 * 60 * 1000
  ),
});
  await userRepository.updateLastSeen(
    user._id
  );

  return {
    user,
    accessToken,
    refreshToken,
  };
}

 async refreshToken(refreshTokenValue) {
  let payload;

  try {
    payload =
      verifyRefreshToken(
        refreshTokenValue
      );
  } catch (error) {
    throw new AuthError(
      "Invalid refresh token"
    );
  }

  const sessions =
    await refreshTokenRepository.findActiveSessions(
      payload.id
    );

  let currentSession = null;

  for (const session of sessions) {
    const matched =
      await compareHash(
        refreshTokenValue,
        session.tokenHash
      );

    if (matched) {
      currentSession = session;
      break;
    }
  }

  if (!currentSession) {
    throw new AuthError(
      "Session not found"
    );
  }

  await refreshTokenRepository.revokeSession(
    currentSession._id,
    "security"
  );

  const newPayload = {
    id: payload.id,
    email: payload.email,
  };

  const accessToken =
    generateAccessToken(
      newPayload
    );

  const newRefreshToken =
    generateRefreshToken(
      newPayload
    );

  const tokenHash =
    await hashValue(
      newRefreshToken
    );

await refreshTokenRepository.create({
  userId: payload.id,
  tokenHash,

  deviceInfo:
    currentSession.deviceInfo,

  ipAddress:
    currentSession.ipAddress,

  expiresAt: new Date(
    Date.now() +
      30 * 24 * 60 * 60 * 1000
  ),
});

  return {
    accessToken,
    refreshToken:
      newRefreshToken,
  };
}

 async changePassword(
  userId,
  currentPassword,
  newPassword
) {
  const user =
    await userRepository.findByIdWithPassword(
      userId
    );

  if (!user) {
    throw new AuthError(
      "User not found"
    );
  }

  const valid =
    await user.comparePassword(
      currentPassword
    );

  if (!valid) {
    throw new AuthError(
      "Current password is incorrect"
    );
  }

  user.passwordHash =
    newPassword;

  await user.save();

  await refreshTokenRepository.revokeAllSessions(
    userId,
    "security"
  );

  return {
    message:
      "Password updated successfully",
  };
}

async getCurrentUser(userId) {
  let user = await userRepository.findByIdWithOrgs(userId);
  if (!user) {
    throw new AuthError("User not found");
  }

  // Dynamic self-healing: Find all organizations where this user is a member
  const Organization = require("../../org/models/organization.model");
  const orgs = await Organization.find({
    "members.userId": userId,
    isActive: true,
  });

  const userOrgIds = new Set(
    user.orgMemberships.map((m) =>
      (m.orgId?._id || m.orgId).toString()
    )
  );

  let needsUpdate = false;
  for (const org of orgs) {
    if (!userOrgIds.has(org._id.toString())) {
      const member = org.members.find(
        (m) => m.userId.toString() === userId.toString()
      );
      if (member) {
        user.orgMemberships.push({
          orgId: org._id,
          role: member.role,
        });
        needsUpdate = true;
      }
    }
  }

  if (needsUpdate) {
    await user.save();
    user = await userRepository.findByIdWithOrgs(userId);
  }

  return user;
}

async searchUserByEmail(email) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return { id: user._id, name: user.name, email: user.email };
}

  async updateNotificationSettings(userId, settings) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.notificationSettings) {
      user.notificationSettings = {};
    }

    if (settings.taskAssigned) {
      if (settings.taskAssigned.email !== undefined) user.notificationSettings.taskAssigned.email = settings.taskAssigned.email;
      if (settings.taskAssigned.inApp !== undefined) user.notificationSettings.taskAssigned.inApp = settings.taskAssigned.inApp;
    }

    if (settings.commentMention) {
      if (settings.commentMention.email !== undefined) user.notificationSettings.commentMention.email = settings.commentMention.email;
      if (settings.commentMention.inApp !== undefined) user.notificationSettings.commentMention.inApp = settings.commentMention.inApp;
    }

    if (settings.wikiUpdated) {
      if (settings.wikiUpdated.email !== undefined) user.notificationSettings.wikiUpdated.email = settings.wikiUpdated.email;
      if (settings.wikiUpdated.inApp !== undefined) user.notificationSettings.wikiUpdated.inApp = settings.wikiUpdated.inApp;
    }

    // Mark paths as modified since nested objects might not auto-detect changes
    user.markModified("notificationSettings");

    await user.save();
    return this.getCurrentUser(userId);
  }
}

module.exports =
  new AuthService();