const softDeletePlugin = (schema) => {
  schema.add({
    deletedAt: {
      type: Date,
      default: null,
    },
  });

  schema.methods.softDelete = async function () {
    this.deletedAt = new Date();
    return this.save();
  };

  schema.methods.restore = async function () {
    this.deletedAt = null;
    return this.save();
  };
};

module.exports = softDeletePlugin;