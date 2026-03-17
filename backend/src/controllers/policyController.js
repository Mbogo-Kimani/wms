const WorkPolicy = require('../models/WorkPolicy');
const logAction = require('../utils/auditLogger');

exports.getPolicies = async (req, res) => {
  try {
    const policies = await WorkPolicy.find();
    res.sendSuccess(policies);
  } catch (error) {
    res.sendError('Server Error', 500);
  }
};

exports.createPolicy = async (req, res) => {
  try {
    const policy = await WorkPolicy.create(req.body);
    await logAction(req, 'policy_created', 'WorkPolicy', policy._id, { name: policy.name });
    res.sendSuccess(policy, 'Policy created', 201);
  } catch (error) {
    res.sendError(error.message, 400);
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const policy = await WorkPolicy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAction(req, 'policy_updated', 'WorkPolicy', policy._id, { name: policy.name });
    res.sendSuccess(policy, 'Policy updated');
  } catch (error) {
    res.sendError(error.message, 400);
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    await WorkPolicy.findByIdAndDelete(req.params.id);
    await logAction(req, 'policy_deleted', 'WorkPolicy', req.params.id);
    res.sendSuccess(null, 'Policy deleted');
  } catch (error) {
    res.sendError(error.message, 400);
  }
};
