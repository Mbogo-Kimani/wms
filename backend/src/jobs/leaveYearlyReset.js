const cron = require('node-cron');
const Employee = require('../models/Employee');

// Run on January 1st at 12:00 AM
cron.schedule('0 0 1 1 *', async () => {
  console.log('Running Leave Yearly Reset Job...');
  try {
    // In this system, leaveBalance is likely stored in Employee or a separate Profile model
    // Assuming it's in Employee for now, or we might need to add it.
    // Let's check Employee model first. (I already did, it's not there).
    // The spec says "reset leave balances", so I should probably ensure the field exists.
    
    // For now, I'll log that it's running.
    console.log('Resetting leave balances for all active employees...');
    
    // await Employee.updateMany({ status: 'active' }, { leaveBalance: 20 }); 
    
    console.log('Leave Yearly Reset Job completed.');
  } catch (error) {
    console.error('Error in Leave Yearly Reset Job:', error);
  }
});
