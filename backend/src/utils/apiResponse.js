function apiResponse(success, data = null, message = null, errorCode = null, details = null) {
  if (success) {
    return {
      success: true,
      data,
      message: message || 'OK',
    };
  }

  return {
    success: false,
    message: message || 'Error',
    errorCode: errorCode || null,
    details: details || null,
  };
}

function successResponse(data = null, message = 'OK') {
  return apiResponse(true, data, message);
}

function errorResponse(message = 'Error', errorCode = null, details = null) {
  return apiResponse(false, null, message, errorCode, details);
}

export { apiResponse, successResponse, errorResponse };

