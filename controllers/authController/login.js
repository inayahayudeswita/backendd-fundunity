const loginService = require("../../services/loginService");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // logika login
    const { user, token } = await loginService.loginService(email, password);

    res.status(200).json({
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    if (error.message === "Email and password are required") {
      return res.status(400).json({ message: error.message });
    }

    if (error.message === "Invalid email or password") {
      return res.status(401).json({ message: error.message });
    }

    res
      .status(500)
      .json({ message: "Error during login", error: error.message });
  }
};

module.exports = { loginUser };
