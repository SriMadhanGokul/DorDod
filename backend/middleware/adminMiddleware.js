const jwt = require("jsonwebtoken");
const User = require("../models/User");

const adminProtect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized. Please log in." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "User not found." });

    if (user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Admins only." });

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
};

module.exports = adminProtect;
