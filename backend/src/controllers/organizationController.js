const Department = require("../models/Department");
const Location = require("../models/Location");
const { District, Zone, Ward } = require("../models/Hierarchy");

exports.listDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({
      organization_id: req.user.organization_id,
    }).sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    next(err);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { name, code, manager_id } = req.body;
    const existing = await Department.findOne({
      organization_id: req.user.organization_id,
      code,
    });
    if (existing) {
      return res.status(409).json({ detail: `Department code '${code}' already exists` });
    }

    const dept = await Department.create({
      organization_id: req.user.organization_id,
      name,
      code,
      manager_id: manager_id || null,
    });
    res.status(201).json(dept);
  } catch (err) {
    next(err);
  }
};

exports.listLocations = async (req, res, next) => {
  try {
    const locations = await Location.find({
      organization_id: req.user.organization_id,
    }).sort({ name: 1 });
    res.json(locations);
  } catch (err) {
    next(err);
  }
};

exports.createLocation = async (req, res, next) => {
  try {
    const { name, site_code, building, floor, room, address, district, zone, ward, latitude, longitude } = req.body;
    const existing = await Location.findOne({
      organization_id: req.user.organization_id,
      site_code,
    });
    if (existing) {
      return res.status(409).json({ detail: `Location site code '${site_code}' already exists` });
    }

    const loc = await Location.create({
      organization_id: req.user.organization_id,
      name,
      site_code,
      building,
      floor,
      room,
      address,
      district,
      zone,
      ward,
      latitude,
      longitude,
    });
    res.status(201).json(loc);
  } catch (err) {
    next(err);
  }
};

exports.listDistricts = async (req, res, next) => {
  try {
    const districts = await District.find({ organization_id: req.user.organization_id }).sort({ name: 1 });
    res.json(districts);
  } catch (err) {
    next(err);
  }
};

exports.listZones = async (req, res, next) => {
  try {
    const { district_id } = req.query;
    const q = { organization_id: req.user.organization_id };
    if (district_id) q.district_id = district_id;
    const zones = await Zone.find(q).sort({ name: 1 });
    res.json(zones);
  } catch (err) {
    next(err);
  }
};

exports.listWards = async (req, res, next) => {
  try {
    const { zone_id } = req.query;
    const q = { organization_id: req.user.organization_id };
    if (zone_id) q.zone_id = zone_id;
    const wards = await Ward.find(q).sort({ name: 1 });
    res.json(wards);
  } catch (err) {
    next(err);
  }
};
