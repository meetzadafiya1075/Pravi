const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");
const Permission = require("../models/Permission");

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "super_secure_secret_key_minimum_32_characters_long_1234567890";

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ detail: "Missing authentication token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.sub).populate({
      path: "role_id",
      populate: { path: "permissions" },
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ detail: "User account inactive or not found" });
    }

    req.user = user;
    req.userRole = user.role_id;
    
    // Resolve all permission codes
    const permissions = [];
    if (user.role_id && Array.isArray(user.role_id.permissions)) {
      user.role_id.permissions.forEach((p) => {
        if (typeof p === "string") permissions.push(p);
        else if (p && p.code) permissions.push(p.code);
      });
    }
    req.userPermissions = permissions;

    next();
  } catch (err) {
    return res.status(401).json({ detail: "Token invalid or expired" });
  }
};

const requirePermission = (permissionCode) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ detail: "Unauthenticated" });
    }

    // Super Admin bypass
    if (req.userRole && req.userRole.code === "SUPER_ADMIN") {
      return next();
    }

    if (req.userPermissions && req.userPermissions.includes(permissionCode)) {
      return next();
    }

    return res.status(403).json({
      detail: `Permission denied: '${permissionCode}' required.`,
    });
  };
};

const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ detail: "Unauthenticated" });
    }
    if (req.userRole && (req.userRole.code === "SUPER_ADMIN" || roles.includes(req.userRole.code))) {
      return next();
    }
    return res.status(403).json({
      detail: `Access restricted to roles: ${roles.join(", ")}`,
    });
  };
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  JWT_SECRET,
};
