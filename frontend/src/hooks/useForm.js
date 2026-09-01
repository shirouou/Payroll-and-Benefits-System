/**
 * useForm Hook
 * Handles form state, validation, and submission
 */

import { useState, useCallback } from 'react';
import { validateForm, validateField } from '../utils/validators';
import { handleApiError } from '../utils/errorHandler';
import { useToast } from '../context/ToastContext';

export const useForm = (initialValues, validationRules, onSubmit) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, isSubmittingLoading] = useState(false);
  const { error: showError, success: showSuccess } = useToast();

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // Validate on blur
    if (validationRules[name]) {
      const error = validateField(name, formData[name], validationRules[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [formData, validationRules]);

  const validate = useCallback(() => {
    const newErrors = validationRules ? validateForm(formData, validationRules) : {};
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validationRules]);

  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!validate()) {
      showError('Please fix the errors before submitting');
      return;
    }

    isSubmittingLoading(true);

    try {
      const result = await onSubmit(formData);
      
      if (result?.success) {
        showSuccess(result?.message || 'Form submitted successfully');
      } else if (result?.message) {
        showError(result.message);
      }
      
      return result;
    } catch (error) {
      const errorResult = handleApiError(error);
      
      if (errorResult.validationErrors && Object.keys(errorResult.validationErrors).length > 0) {
        setErrors(errorResult.validationErrors);
      }
      
      showError(errorResult.message);
      return errorResult;
    } finally {
      isSubmittingLoading(false);
    }
  }, [formData, onSubmit, validate, showError, showSuccess]);

  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  const getFieldProps = useCallback((name) => ({
    name,
    value: formData[name] || '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched[name] ? errors[name] : null,
  }), [formData, errors, touched, handleChange, handleBlur]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    touched,
    setTouched,
    isSubmitting: isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    validate,
    setFieldValue,
    setFieldError,
    getFieldProps,
  };
};

export default useForm;
