const dayjs = require('dayjs');
const { isWorkingDay } = require('./dateUtils');

/**
 * Calculates leave days excluding weekends and holidays
 */
const calculateLeaveDays = async (startDate, endDate) => {
  let start = dayjs(startDate);
  const end = dayjs(endDate);
  let count = 0;

  while (start.isBefore(end) || start.isSame(end, 'day')) {
    if (await isWorkingDay(start)) {
      count++;
    }
    start = start.add(1, 'day');
  }

  return count;
};

module.exports = calculateLeaveDays;
