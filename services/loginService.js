const userRepository = require("../repositories/userRepository");
const { verifyPassword } = require("../utils/passwordUtils");
const { generateToken } = require("../utils/tokenUtils");

const loginService = async (email, password) => {
  // Validasi input
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  // Cari user berdasarkan email
  const user = await userRepository.findUserByEmail(email);

  // Handle user tidak ditemukan
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verifikasi password
  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  // Hapus password dari response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

module.exports = { loginService };
