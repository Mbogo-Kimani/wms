const { z } = require('zod');

exports.registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'manager', 'supervisor', 'worker']).optional(),
    employeeId: z.string().optional()
  })
});

exports.loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

exports.leaveRequestSchema = z.object({
  body: z.object({
    leaveType: z.enum(['annual', 'sick', 'unpaid']),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    reason: z.string().min(5, 'Please provide a valid reason')
  })
});