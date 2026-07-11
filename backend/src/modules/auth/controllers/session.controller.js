const SessionService = require(
  "../services/session.service"
);

const ApiResponse = require(
  "../../../shared/utils/ApiResponse"
);

class SessionController {
  async logout(req, res) {
    const result =
      await SessionService.logout(
        req.user.id,
        {
          sessionId: req.body.sessionId,
          refreshToken: req.body.refreshToken,
        }
      );

    return res.json(
      new ApiResponse({
        message:
          result.message,
      })
    );
  }

  async logoutAll(req, res) {
    const result =
      await SessionService.logoutAll(
        req.user.id
      );

    return res.json(
      new ApiResponse({
        message:
          result.message,
      })
    );
  }

  async getSessions(req, res) {
    const sessions =
      await SessionService.getSessions(
        req.user.id
      );

    return res.json(
      new ApiResponse({
        message:
          "Sessions fetched successfully",
        data: sessions,
      })
    );
  }

  async revokeSession(
    req,
    res
  ) {
    const result =
      await SessionService.revokeSession(
        req.user.id,
        req.params.sessionId
      );

    return res.json(
      new ApiResponse({
        message:
          result.message,
        })
    );
  }
}

module.exports =
  new SessionController();
