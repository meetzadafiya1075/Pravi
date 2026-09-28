const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcryptjs");

exports.listUsers = async (req, res, next) => {
  try {
    const { department_id } = req.query;
    const query = { organization_id: req.user.organization_id };
    if (department_id) query.department_id = department_id;

    const users = await User.find(query)
      .populate({
        path: "role_id",
        populate: { path: "permissions" },
      })
      .sort({ createdAt: -1 });

    const formatted = users.map((u) => {
      const perms = [];
      if (u.role_id && Array.isArray(u.role_id.permissions)) {
        u.role_id.permissions.forEach((p) => {
          if (typeof p === "string") perms.push(p);
          else if (p && p.code) perms.push(p.code);
        });
      }
      return {
        id: u.id || u._id,
        organization_id: u.organization_id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role_code: u.role_id?.code || "VIEWER",
        department_id: u.department_id,
        district: u.district,
        zone: u.zone,
        ward: u.ward,
        phone: u.phone,
        is_active: u.is_active,
        permissions: perms,
      };
    });

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role_id, department_id, district, zone, ward, phone } = req.body;
    const existing = await User.findOne({
      organization_id: req.user.organization_id,
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(409).json({ detail: `User with email '${email}' already exists` });
    }

    const role = await Role.findById(role_id).populate("permissions");
    if (!role) {
      return res.status(404).json({ detail: `Role '${role_id}' not found` });
    }

    const hashedPassword = await bcrypt.hash(password || "Password123!", 10);
    const newUser = await User.create({
      organization_id: req.user.organization_id,
      email: email.toLowerCase().trim(),
      hashed_password: hashedPassword,
      first_name,
      last_name,
      role_id: role.id || role._id,
      department_id: department_id || null,
      district: district || null,
      zone: zone || null,
      ward: ward || null,
      phone: phone || null,
      is_active: true,
    });

    const perms = [];
    if (role.permissions && Array.isArray(role.permissions)) {
      role.permissions.forEach((p) => {
        if (typeof p === "string") perms.push(p);
        else if (p && p.code) perms.push(p.code);
      });
    }

    res.status(201).json({
      id: newUser.id || newUser._id,
      organization_id: newUser.organization_id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      role_code: role.code,
      department_id: newUser.department_id,
      phone: newUser.phone,
      is_active: newUser.is_active,
      permissions: perms,
    });
  } catch (err) {
    next(err);
  }
};

exports.listRoles = async (req, res, next) => {
  try {
    const roles = await Role.find({
      $or: [{ organization_id: req.user.organization_id }, { is_system: true }],
    }).populate("permissions");
    res.json(roles);
  } catch (err) {
    next(err);
  }
};
