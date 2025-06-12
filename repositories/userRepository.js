const { prisma } = require("../config/db");

const findUserByEmail = async (email) => {
  return await prisma.users.findUnique({
    where: { email },
  });
};

module.exports = { findUserByEmail };
