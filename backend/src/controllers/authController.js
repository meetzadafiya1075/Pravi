const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Role = require("../models/Role");
const RefreshToken = require("../models/RefreshToken");
const { JWT_SECRET } = require("../middleware/auth");

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_super_secret_jwt_key_9876543210";
const ACCESS_TOKEN_EXPIRE = "15m";
const REFRESH_TOKEN_EXPIRE_DAYS = 7;

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createTokenPair = async (user) => {
  const payload = {
    sub: user.id || user._id,
    email: user.email,
    org: user.organization_id,
    role: user.role_id?.code || "VIEWER",
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRE });
  const rawRefreshToken = uuidv4() + "." + crypto.randomBytes(32).toString("hex");
  const hashed = hashToken(rawRefreshToken);
  const familyId = uuidv4();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRE_DAYS);

  await RefreshToken.create({
    user_id: user.id || user._id,
    token_hash: hashed,
    family_id: familyId,
    expires_at: expiresAt,
  });

  return {
    access_token: accessToken,
    refresh_token: rawRefreshToken,
    token_type: "bearer",
  };
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate({
      path: "role_id",
      populate: { path: "permissions" },
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ detail: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ detail: "Invalid email or password" });
    }

    user.last_login_at = new Date();
    await user.save();

    const tokens = await createTokenPair(user);
    const permissions = [];
    if (user.role_id && Array.isArray(user.role_id.permissions)) {
      user.role_id.permissions.forEach((p) => {
        if (typeof p === "string") permissions.push(p);
        else if (p && p.code) permissions.push(p.code);
      });
    }

    res.json({
      ...tokens,
      user: {
        id: user.id || user._id,
        organization_id: user.organization_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role_code: user.role_id?.code || "VIEWER",
        department_id: user.department_id,
        district: user.district,
        zone: user.zone,
        ward: user.ward,
        phone: user.phone,
        is_active: user.is_active,
        permissions: permissions,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ detail: "Missing refresh_token" });
    }

    const hashed = hashToken(refresh_token);
    const existing = await RefreshToken.findOne({ token_hash: hashed });

    if (!existing || existing.is_revoked || existing.expires_at < new Date()) {
      if (existing) {
        // Family compromise detected: revoke entire family
        await RefreshToken.updateMany({ family_id: existing.family_id }, { is_revoked: true });
      }
      return res.status(401).json({ detail: "Invalid or expired refresh token" });
    }

    // Revoke used token
    existing.is_revoked = true;
    await existing.save();

    const user = await User.findById(existing.user_id).populate("role_id");
    if (!user || !user.is_active) {
      return res.status(401).json({ detail: "User inactive or not found" });
    }

    const tokens = await createTokenPair(user);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const permissions = req.userPermissions || [];

    res.json({
      id: user.id || user._id,
      organization_id: user.organization_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role_code: req.userRole?.code || "VIEWER",
      department_id: user.department_id,
      district: user.district,
      zone: user.zone,
      ward: user.ward,
      phone: user.phone,
      is_active: user.is_active,
      permissions: permissions,
    });
  } catch (err) {
    next(err);
  }
};
