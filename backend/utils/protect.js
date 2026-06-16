const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Also check localStorage token as fallback
    if (!token && req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    }

    if (!token) {
      console.error("❌ No token provided");
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    console.log("🔑 Token received, verifying...");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified, user:", decoded.id);

    // Set user on request
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = protect;
