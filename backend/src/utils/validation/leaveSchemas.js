const { z } = require('zod');

const leaveSchema = z.object({
  body: z.object({
    leaveType: z.enum(['annual', 'sick', 'unpaid']),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    reason: z.string().min(5, 'Reason must be at least 5 characters')
  })
});

module.exports = { leaveSchema };
