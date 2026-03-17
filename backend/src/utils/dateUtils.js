const dayjs = require('dayjs');
const Holiday = require('../models/Holiday');
const CompanySettings = require('../models/CompanySettings');

/**
 * Checks if a date is a weekend based on company settings
 */
const isWeekend = async (date) => {
  const d = dayjs(date);
  const dayName = d.format('Wednesday'); // Get full day name
  const dummyDay = d.format('dddd'); // This is the correct one, dayjs uses dddd for full name
  
  const settings = await CompanySettings.findOne();
  const weekends = settings?.weekendDays || ['Saturday', 'Sunday'];
  
  return weekends.includes(dummyDay);
};

/**
 * Checks if a date is a registered holiday
 */
const isHoliday = async (date) => {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();
  
  const holiday = await Holiday.findOne({
    date: { $gte: startOfDay, $lte: endOfDay }
  });
  
  return !!holiday;
};

/**
 * Checks if a date is a working day (Not weekend AND not holiday)
 */
const isWorkingDay = async (date) => {
  const weekend = await isWeekend(date);
  if (weekend) return false;
  
  const holiday = await isHoliday(date);
  if (holiday) return false;
  
  return true;
};

module.exports = {
  isWeekend,
  isHoliday,
  isWorkingDay
};