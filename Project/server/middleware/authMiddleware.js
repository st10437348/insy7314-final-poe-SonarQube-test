const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { logEvent } = require("../utils/logger");

// Verifies the JWT sent in the httpOnly "token" cookie.
// Usage: router.get("/protected-route", protect, someController);
const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if(!token) return res.status(401).json({message: "Not authorized, no token provided."});

  let decoded;
  try{
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  }
  catch(error){
    logEvent("warn", "auth.token.invalid", req, { reason: error.name === "TokenExpiredError" ? "expired" : "invalid_signature_or_format" });
    return res.status(401).json({message: "Not authorized, invalid or expired token."});
  }

  try{
    //Search local first
    let user = await User.findById(decoded.id).select("_id role isActive tokenVersion");

    if (!user || !user.isActive) {
      logEvent("warn", "auth.token.account_unavailable", req, { targetUserId: decoded.id });
      return res.status(401).json({ message: "Account is unavailable." });
    }

    // Security feature 2: a token issued before the user's last logout,
    // deactivation or role change is revoked even if it has not expired.
    if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
      logEvent("warn", "auth.token.revoked", req, { targetUserId: decoded.id });
      return res.status(401).json({ message: "Session has ended. Please log in again." });
    }

    req.user = { id: user._id.toString(), role: user.role };

    next();
  }
  catch(error){
    logEvent("warn", "auth.token.invalid", req, { reason: "lookup_failed" });
    return res.status(401).json({message: "Not authorized, invalid or expired token."});
  }
};

// Restricts a route to the listed roles, e.g. authorizeRoles("Admin").
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      logEvent("warn", "access.denied.role", req, {
        method: req.method,
        route: req.baseUrl,
        requiredRoles: allowedRoles
      });
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
