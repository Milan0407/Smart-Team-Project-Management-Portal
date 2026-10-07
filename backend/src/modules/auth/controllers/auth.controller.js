const AuthService = require(
  "../services/auth.service"
);

const ApiResponse = require(
  "../../../shared/utils/ApiResponse"
);

class AuthController {
  async sendRegisterOtp(req, res) {
    const result =
      await AuthService.sendRegisterOtp(
        req.body.email
      );

    return res.json(
      new ApiResponse({
        message:
          "OTP sent successfully",
        data: result,
      })
    );
  }

  async register(req, res) {
    const result =
      await AuthService.register(
        req.body,
        {
          deviceInfo: {
            userAgent:
              req.headers[
                "user-agent"
              ] || null,
          },

          ipAddress:
            req.ip ||
            req.socket
              ?.remoteAddress ||
            null,
        }
      );

    return res.status(201).json(
      new ApiResponse({
        message:
          "User registered successfully",
        data: result,
      })
    );
  }

  async login(req, res) {
    const result =
      await AuthService.login(
        req.body,
        {
          deviceInfo: {
            userAgent:
              req.headers[
                "user-agent"
              ] || null,
          },

          ipAddress:
            req.ip ||
            req.socket
              ?.remoteAddress ||
            null,
        }
      );

    return res.json(
      new ApiResponse({
        message:
          "Login successful",
        data: result,
      })
    );
  }

  async sendLoginOtp(req, res) {
    const result =
      await AuthService.sendLoginOtp(
        req.body.email
      );

    return res.json(
      new ApiResponse({
        message:
          "Login OTP sent successfully",
        data: result,
      })
    );
  }

  async loginWithOtp(req, res) {
    const result =
      await AuthService.loginWithOtp(
        req.body,
        {
          deviceInfo: {
            userAgent:
              req.headers[
                "user-agent"
              ] || null,
          },

          ipAddress:
            req.ip ||
            req.socket
              ?.remoteAddress ||
            null,
        }
      );

    return res.json(
      new ApiResponse({
        message:
          "Login successful",
        data: result,
      })
    );
  }

  async refreshToken(
    req,
    res
  ) {
    const result =
      await AuthService.refreshToken(
        req.body.refreshToken
      );

    return res.json(
      new ApiResponse({
        message:
          "Token refreshed successfully",
        data: result,
      })
    );
  }

  async changePassword(
    req,
    res
  ) {
    const result =
      await AuthService.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword
      );

    return res.json(
      new ApiResponse({
        message:
          result.message,
      })
    );
  }

  async getCurrentUser(
    req,
    res
  ) {
    const user = await AuthService.getCurrentUser(req.user.id);
    
    return res.json(
      new ApiResponse({
        message:
          "Current user fetched successfully",
        data: user,
      })
    );
  }

  async searchUserByEmail(req, res) {
    const result = await AuthService.searchUserByEmail(req.query.email);
    
    return res.json(
      new ApiResponse({
        message: "User found successfully",
        data: result,
      })
    );
  }

  async updateNotificationSettings(req, res) {
    const result = await AuthService.updateNotificationSettings(req.user.id, req.body);
    
    return res.json(
      new ApiResponse({
        message: "Notification settings updated successfully",
        data: result,
      })
    );
  }
}

module.exports =
  new AuthController();
