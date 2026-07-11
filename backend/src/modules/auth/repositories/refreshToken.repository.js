const RefreshToken = require(
  "../models/refreshToken.model"
);

class RefreshTokenRepository {
  async create(tokenData) {
    return RefreshToken.create(tokenData);
  }

  async findById(tokenId) {
    return RefreshToken.findById(tokenId);
  }

async findActiveSessions(userId) {
  return RefreshToken.find({
    userId,
    revoked: false,
  })
    .select("+tokenHash")
    .sort({
      createdAt: -1,
    });
}

  async revokeSession(
    tokenId,
    reason = "logout"
  ) {
    return RefreshToken.findByIdAndUpdate(
      tokenId,
      {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
      {
        new: true,
      }
    );
  }

  async revokeAllSessions(
    userId,
    reason = "logout"
  ) {
    return RefreshToken.updateMany(
      {
        userId,
        revoked: false,
      },
      {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      }
    );
  }

  async deleteExpired() {
    return RefreshToken.deleteMany({
      expiresAt: {
        $lt: new Date(),
      },
    });
  }

  async createSession(sessionData) {
  return RefreshToken.create(
    sessionData
  );
}

async findUserSession(
  userId,
  sessionId
) {
  return RefreshToken.findOne({
    _id: sessionId,
    userId,
    revoked: false,
  });
}
}

module.exports =
  new RefreshTokenRepository();