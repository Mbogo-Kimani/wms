const Memo = require('../models/Memo');
const Employee = require('../models/Employee');
const { sendEmail } = require('../services/emailService');

exports.getMemos = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { $or: [{ department: req.user.department }, { department: 'all' }] };
    const memos = await Memo.find(query).sort({ createdAt: -1 });
    res.sendSuccess(memos);
  } catch (err) { next(err); }
};

exports.createMemo = async (req, res, next) => {
  try {
    const memo = await Memo.create({ ...req.body, createdBy: req.user.id });
    
    // Notify relevant employees
    const employees = await Employee.find(memo.department === 'all' ? {} : { department: memo.department });
    const emails = employees.map(emp => emp.email).filter(email => email);
    
    if (emails.length > 0) {
      await sendEmail(
        emails.join(','), 
        `New Memo: ${memo.title}`, 
        memo.message, 
        `<h3>${memo.title}</h3><p>${memo.message}</p>`
      );
    }

    res.sendSuccess(memo, 'Memo created', 201);
  } catch (err) { next(err); }
};

exports.deleteMemo = async (req, res, next) => {
  try {
    const memo = await Memo.findByIdAndDelete(req.params.id);
    if (!memo) return res.sendError('Memo not found', 404);
    res.sendSuccess(null, 'Memo deleted');
  } catch (err) { next(err); }
};

exports.updateMemo = async (req, res, next) => {
  try {
    const memo = await Memo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!memo) return res.sendError('Memo not found', 404);
    res.sendSuccess(memo, 'Memo updated');
  } catch (err) { next(err); }
};