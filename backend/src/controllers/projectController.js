const InfrastructureProject = require("../models/InfrastructureProject");

exports.listProjects = async (req, res, next) => {
  try {
    const { department_id, status } = req.query;
    const query = { organization_id: req.user.organization_id };

    if (department_id) query.department_id = department_id;
    if (status) query.status = status.toUpperCase();

    const projects = await InfrastructureProject.find(query).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const {
      project_code,
      name,
      description,
      department_id,
      contractor_id,
      funding_source,
      funding_scheme,
      budget_allocated,
      start_date,
      expected_completion,
      status,
    } = req.body;

    const existing = await InfrastructureProject.findOne({
      organization_id: req.user.organization_id,
      project_code,
    });
    if (existing) {
      return res.status(409).json({ detail: `Project code '${project_code}' already exists` });
    }

    const project = await InfrastructureProject.create({
      organization_id: req.user.organization_id,
      project_code,
      name,
      description,
      department_id,
      contractor_id: contractor_id || null,
      funding_source: funding_source || "State Infrastructure Budget",
      funding_scheme: funding_scheme || null,
      budget_allocated: budget_allocated ? Number(budget_allocated) : 0,
      actual_expenditure: 0,
      start_date: start_date ? new Date(start_date) : null,
      expected_completion: expected_completion ? new Date(expected_completion) : null,
      status: status ? status.toUpperCase() : "ACTIVE",
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await InfrastructureProject.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
    });
    if (!project) {
      return res.status(404).json({ detail: `Project '${req.params.id}' not found` });
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
};
