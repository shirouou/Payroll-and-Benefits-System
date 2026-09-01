/**
 * Error Handling Utility
 * Processes API errors and formats them for display
 */

/**
 * Extract error message from API response
 * Handles various error formats from backend
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';

  // Axios error
  if (error.response) {
    const { data, status } = error.response;

    // Error from our API
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    // Standard HTTP status messages
    const statusMessages = {
      400: 'Bad request. Please check your input.',
      401: 'Unauthorized. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'Resource not found.',
      409: 'Conflict. This resource may already exist.',
      422: 'Validation error. Please check your input.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      502: 'Bad gateway. The server is temporarily unavailable.',
      503: 'Service unavailable. Please try again later.',
    };

    return statusMessages[status] || `Error (${status}). Please try again.`;
  }

  // Network error
  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection.';
  }

  // Timeout
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  // Generic message
  return error.message || 'An unknown error occurred';
};

/**
 * Extract validation errors from API response
 * Returns object with field names as keys and error messages as values
 */
export const getValidationErrors = (error) => {
  if (!error?.response?.data) return {};

  const { data } = error.response;

  // Handle express-validator format
  if (data.errors && Array.isArray(data.errors)) {
    const fieldErrors = {};
    data.errors.forEach(err => {
      fieldErrors[err.param] = err.msg;
    });
    return fieldErrors;
  }

  // Handle custom validation errors
  if (data.validationErrors && typeof data.validationErrors === 'object') {
    return data.validationErrors;
  }

  // Handle single field error
  if (data.field && data.message) {
    return { [data.field]: data.message };
  }

  return {};
};

/**
 * Check if error is a specific type
 */
export const isError = {
  unauthorized: (error) => error?.response?.status === 401,
  forbidden: (error) => error?.response?.status === 403,
  notFound: (error) => error?.response?.status === 404,
  validation: (error) => error?.response?.status === 422 || error?.response?.status === 400,
  conflict: (error) => error?.response?.status === 409,
  networkError: (error) => !error?.response,
  timeout: (error) => error?.code === 'ECONNABORTED',
};

/**
 * Format error for display in UI
 */
export const formatError = (error) => {
  const message = getErrorMessage(error);
  const validationErrors = getValidationErrors(error);

  return {
    message,
    validationErrors,
    isValidation: Object.keys(validationErrors).length > 0,
    type: isError.unauthorized(error)
      ? 'unauthorized'
      : isError.forbidden(error)
        ? 'forbidden'
        : isError.notFound(error)
          ? 'notFound'
          : isError.validation(error) ? 'validation' : 'error',
  };
};

/**
 * Handle API errors and return formatted response
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  const formatted = formatError(error);
  
  return {
    success: false,
    message: formatted.message || defaultMessage,
    validationErrors: formatted.validationErrors,
    errorType: formatted.type,
  };
};
