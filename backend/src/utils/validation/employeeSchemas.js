const { z } = require('zod');

const employeeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    religion: z.string().optional(),
    religiousRestDay: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'None']).optional(),
    weekendWorker: z.boolean().optional(),
    holidayWorker: z.boolean().optional(),
    workPolicy: z.string().optional(),
    department: z.string().min(1, 'Department is required'),
    position: z.string().min(1, 'Position is required'),
    dateHired: z.string().or(z.date()),
    shiftId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid shift ID'),
    status: z.enum(['active', 'inactive', 'on_leave']).default('active')
  })
});

module.exports = { employeeSchema };
