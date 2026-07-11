const bcrypt = require("bcryptjs");

const hashValue = async (
  value
) => {
  return bcrypt.hash(value, 12);
};

const compareHash = async (
  value,
  hash
) => {
  return bcrypt.compare(
    value,
    hash
  );
};

module.exports = {
  hashValue,
  compareHash,
};