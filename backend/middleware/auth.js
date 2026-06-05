const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token, authorization denied",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret",
    );

    // Attach user ID to request
    req.userId = decoded.id || decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Token is not valid",
    });
  }
};

module.exports = auth;
