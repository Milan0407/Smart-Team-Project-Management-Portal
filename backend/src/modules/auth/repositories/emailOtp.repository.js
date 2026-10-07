const EmailOtp = require("../models/emailOtp.model");

class EmailOtpRepository {
  async create({ email, purpose, otpHash, expiresAt }) {
    await EmailOtp.deleteMany({
      email: email.toLowerCase(),
      purpose,
    });

    return EmailOtp.create({
      email,
      purpose,
      otpHash,
      expiresAt,
    });
  }

  async findLatest(email, purpose) {
    return EmailOtp.findOne({
      email: email.toLowerCase(),
      purpose,
    })
      .select("+otpHash")
      .sort({ createdAt: -1 });
  }

  async incrementAttempts(id) {
    return EmailOtp.findByIdAndUpdate(id, {
      $inc: { attempts: 1 },
    });
  }

  async deleteById(id) {
    return EmailOtp.findByIdAndDelete(id);
  }
}

module.exports = new EmailOtpRepository();
