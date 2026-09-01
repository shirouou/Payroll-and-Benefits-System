/**
 * FormField Component
 * Reusable form field with validation error display
 */

import React from 'react';
import '../styles/FormField.css';

export const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  help,
  ...props
}) => {
  const hasError = error && error.trim();

  return (
    <div className={`form-field ${hasError ? 'has-error' : ''}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="form-input"
          {...props}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className="form-input"
          {...props}
        >
          <option value="">Select {label?.toLowerCase()}</option>
          {props.options && props.options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id={name}
            name={name}
            checked={value || false}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className="form-checkbox"
            {...props}
          />
          <label htmlFor={name} className="checkbox-label">
            {label}
          </label>
        </div>
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="form-input"
          {...props}
        />
      )}

      {hasError && (
        <span className="error-message">{error}</span>
      )}

      {help && !hasError && (
        <span className="help-text">{help}</span>
      )}
    </div>
  );
};

/**
 * Form Component
 * Wrapper for form with consistent styling
 */
export const Form = ({ onSubmit, children, className = '', ...props }) => {
  return (
    <form
      onSubmit={onSubmit}
      className={`form ${className}`}
      noValidate
      {...props}
    >
      {children}
    </form>
  );
};

/**
 * FormButton Component
 * Consistent button styling for forms
 */
export const FormButton = ({
  children,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`form-button form-button-${variant} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="spinner"></span>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default FormField;
