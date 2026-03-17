/**
 * Standardizes API responses across the system
 */
const responseHandler = (req, res, next) => {
  res.sendSuccess = (data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };

  res.sendError = (message = 'Error', statusCode = 500, error = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      error: error ? error.message || error : null
    });
  };

  next();
};

module.exports = responseHandler;
