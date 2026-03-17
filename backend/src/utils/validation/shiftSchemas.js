const { z } = require('zod');

const shiftSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Shift name is required'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Invalid time format (HH:mm)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Invalid time format (HH:mm)'),
    gracePeriodMinutes: z.number().min(0).default(15),
    lateAfterMinutes: z.number().min(0).default(15),
    overtimeAfterMinutes: z.number().min(0).default(60),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      radius: z.number().min(0)
    }).optional(),
    days: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])).optional()
  })
});

module.exports = { shiftSchema };
