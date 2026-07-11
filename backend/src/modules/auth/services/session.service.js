const refreshTokenRepository = require(
  "../repositories/refreshToken.repository"
);

const {
  compareHash,
} = require("../utils/hash.util");

const NotFoundError = require(
  "../../../shared/errors/NotFoundError"
);

class SessionService {
  async logout(
    userId,
    {
      sessionId,
      refreshToken,
    } = {}
  ) {
    if (sessionId) {
      return this.revokeSession(
        userId,
        sessionId
      );
    }

    if (refreshToken) {
      const sessions =
        await refreshTokenRepository.findActiveSessions(
          userId
        );

      for (const session of sessions) {
        const matched =
          await compareHash(
            refreshToken,
            session.tokenHash
          );

        if (matched) {
          await refreshTokenRepository.revokeSession(
            session._id,
            "logout"
          );

          return {
            message:
              "Logged out successfully",
          };
        }
      }
    }

    throw new NotFoundError(
      "Session not found"
    );
  }

  async logoutAll(userId) {
    await refreshTokenRepository.revokeAllSessions(
      userId,
      "logout"
    );

    return {
      message:
        "All sessions revoked successfully",
    };
  }

  async getSessions(userId) {
    const sessions =
      await refreshTokenRepository.findActiveSessions(
        userId
      );

    return sessions;
  }

  async revokeSession(
    userId,
    sessionId
  ) {
    const session =
      await refreshTokenRepository.findUserSession(
        userId,
        sessionId
      );

    if (!session) {
      throw new NotFoundError(
        "Session not found"
      );
    }

    await refreshTokenRepository.revokeSession(
      sessionId,
      "logout"
    );

    return {
      message:
        "Session revoked successfully",
    };
  }
}

module.exports =
  new SessionService();
