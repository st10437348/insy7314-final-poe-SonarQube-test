const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT sent in the Authorization header.
// Usage: router.get("/protected-route", protect, someController);
const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if(!token) return res.status(401).json({message: "Not authorized, no token provided."});

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //Search local first
    let user = await User.findById(decoded.id).select("_id role isActive");
  
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Account is unavailable." });
    }
    req.user = { id: user._id.toString(), role: user.role };

    next();
  }
  catch(error){
    return res.status(401).json({message: "Not authorized, invalid or expired token."});
  }
};

// restrict by role in the future, e.g. protect("Admin")
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
