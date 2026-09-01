# Frontend - Form Validation & Error Handling Guide

## Overview

This guide covers the form validation, error handling, and notification systems implemented in the frontend.

## Components & Utilities

### 1. Form Validators (`src/utils/validators.js`)

Pre-built validators for common form fields:

```javascript
import { validators, validateForm, validateField } from '@/utils/validators';

// Validate a single field
const error = validators.email('invalid-email');
// Returns: "Invalid email format"

// Validate password strength
const passwordError = validators.password('weak');
// Returns: "Password must be at least 8 characters"

// Custom validation with multiple rules
const nameError = validators.name('John123');
// Returns: "Name can only contain letters, spaces, hyphens, and apostrophes"
```

#### Available Validators

- `email(value)` - Email format validation
- `password(value)` - Strong password validation (8+ chars, uppercase, lowercase, numbers, special chars)
- `required(value, fieldName)` - Required field validation
- `minLength(value, min, fieldName)` - Minimum length validation
- `maxLength(value, max, fieldName)` - Maximum length validation
- `number(value, fieldName)` - Number validation
- `positiveNumber(value, fieldName)` - Positive number validation
- `phone(value, fieldName)` - Phone number validation
- `url(value, fieldName)` - URL validation
- `name(value, fieldName)` - Name validation (letters, spaces, hyphens, apostrophes)
- `date(value, fieldName)` - Date format validation
- `pastDate(value, fieldName)` - Date must be in the past
- `futureDate(value, fieldName)` - Date must be in the future
- `match(value1, value2, fieldName)` - Two fields must match
- `employeeId(value)` - Employee ID format
- `ssn(value)` - SSN format (XXX-XX-XXXX)

### 2. Form Validation Functions

#### validateForm()
Validate entire form against validation rules:

```javascript
import { validateForm } from '@/utils/validators';

const formData = {
  email: 'user@example.com',
  password: 'WeakPass',
  confirmPassword: 'WeakPass',
};

const rules = {
  email: 'email',
  password: 'password',
  confirmPassword: [
    'required',
    (value, fieldName) => validators.match(formData.password, value, 'Passwords'),
  ],
};

const errors = validateForm(formData, rules);
// Returns: { password: "Password must be at least 8 characters", ... }
```

#### validateField()
Validate a single field:

```javascript
import { validateField } from '@/utils/validators';

const error = validateField('email', 'invalid@', 'email');
// Returns: "Invalid email format"
```

### 3. useForm Hook (`src/hooks/useForm.js`)

Complete form handling hook combining state, validation, and submission:

```javascript
import { useForm } from '@/hooks/useForm';

function LoginForm() {
  const { 
    formData, 
    errors, 
    touched, 
    isSubmitting, 
    handleChange, 
    handleBlur, 
    handleSubmit, 
    getFieldProps 
  } = useForm(
    // Initial values
    { email: '', password: '' },
    
    // Validation rules
    {
      email: 'email',
      password: 'password',
    },
    
    // Submit handler
    async (formData) => {
      const response = await loginAPI.login(formData);
      return response.data;
    }
  );

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Email"
        {...getFieldProps('email')}
      />
      <FormField
        label="Password"
        type="password"
        {...getFieldProps('password')}
      />
      <FormButton 
        type="submit" 
        isLoading={isSubmitting}
      >
        Login
      </FormButton>
    </form>
  );
}
```

#### useForm Methods

- `formData` - Current form values
- `errors` - Validation errors object
- `touched` - Fields that have been visited
- `isSubmitting` - Loading state during submission
- `handleChange(e)` - Handle input changes
- `handleBlur(e)` - Handle blur events (marks field as touched)
- `handleSubmit(e)` - Handle form submission with validation
- `resetForm()` - Reset form to initial values
- `validate()` - Manually validate entire form
- `setFieldValue(name, value)` - Set a field's value programmatically
- `setFieldError(name, error)` - Set a field's error message
- `getFieldProps(name)` - Get props object for a field (name, value, onChange, onBlur, error)

### 4. Form Components

#### FormField
Reusable form field component with error display:

```javascript
import { FormField } from '@/components/FormField';

<FormField
  label="Full Name"
  name="name"
  type="text"
  value={formData.name}
  onChange={handleChange}
  onBlur={handleBlur}
  error={touched.name && errors.name}
  placeholder="Enter full name"
  required
  help="Letters, spaces, hyphens, and apostrophes only"
/>
```

#### FormButton
Button component with loading state:

```javascript
import { FormButton } from '@/components/FormField';

<FormButton 
  type="submit" 
  variant="primary" 
  isLoading={isSubmitting}
>
  Submit
</FormButton>
```

Variants: `primary`, `secondary`, `danger`, `warning`

#### Form
Form wrapper component:

```javascript
import { Form, FormField, FormButton } from '@/components/FormField';

<Form onSubmit={handleSubmit}>
  <FormField {...fieldProps} />
  <FormButton type="submit">Submit</FormButton>
</Form>
```

### 5. Error Handling (`src/utils/errorHandler.js`)

Process API errors into user-friendly messages:

```javascript
import { 
  getErrorMessage, 
  getValidationErrors, 
  formatError, 
  handleApiError 
} from '@/utils/errorHandler';

try {
  await apiClient.post('/api/auth/login', data);
} catch (error) {
  const { message, validationErrors, errorType } = formatError(error);
  
  if (errorType === 'validation') {
    // Handle validation errors
    Object.keys(validationErrors).forEach(field => {
      setFieldError(field, validationErrors[field]);
    });
  } else {
    // Show general error
    showError(message);
  }
}
```

#### Error Handling Functions

- `getErrorMessage(error)` - Extract user-friendly error message
- `getValidationErrors(error)` - Extract field validation errors
- `formatError(error)` - Format complete error object
- `handleApiError(error)` - Complete error handling with defaults
- `isError.unauthorized(error)` - Check if 401
- `isError.forbidden(error)` - Check if 403
- `isError.notFound(error)` - Check if 404
- `isError.validation(error)` - Check if validation error
- `isError.networkError(error)` - Check if network error

### 6. Toast Notifications (`src/context/ToastContext.jsx`)

Global toast notification system:

```javascript
import { useToast } from '@/context/ToastContext';

function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleAction = async () => {
    try {
      await someAction();
      success('Action completed successfully!');
    } catch (err) {
      error('Action failed: ' + err.message);
    }
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

#### Toast Methods

- `success(message, options)` - Show success toast
- `error(message, options)` - Show error toast (5s duration)
- `warning(message, options)` - Show warning toast
- `info(message, options)` - Show info toast
- `addToast(message, options)` - Custom toast
- `removeToast(id)` - Remove specific toast

Options:
- `type` - 'success', 'error', 'warning', 'info'
- `duration` - Milliseconds to show (null for persistent)
- `id` - Custom ID for toast

### 7. API Client with Auto Token Refresh (`src/services/api.js`)

Enhanced axios client with automatic token refresh:

```javascript
import { employeeAPI, payrollAPI } from '@/services/api';

// Automatic JWT token management
try {
  const response = await employeeAPI.getAll();
  // Token automatically added to request
  // If 401 received, automatically refreshes token and retries
} catch (error) {
  // Handle error
}
```

Features:
- Automatic JWT token injection
- Automatic token refresh on 401
- Queue failed requests during token refresh
- Redirect to login on refresh failure

## Complete Example

Here's a complete example of a login form using all components:

```javascript
import { useForm } from '@/hooks/useForm';
import { Form, FormField, FormButton } from '@/components/FormField';
import { useToast } from '@/context/ToastContext';
import { authAPI } from '@/services/api';

export default function LoginForm() {
  const { success } = useToast();
  const { 
    formData, 
    errors, 
    touched, 
    isSubmitting, 
    handleChange, 
    handleBlur, 
    handleSubmit,
  } = useForm(
    { email: '', password: '' },
    {
      email: 'email',
      password: 'password',
    },
    async (data) => {
      const response = await authAPI.login(data);
      if (response.data.token) {
        localStorage.setItem('payroll_auth_token', response.data.token);
        localStorage.setItem('payroll_refresh_token', response.data.refreshToken);
        success('Login successful!');
        window.location.href = '/';
      }
      return { success: true, message: 'Login successful!' };
    }
  );

  return (
    <Form onSubmit={handleSubmit}>
      <FormField
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email && errors.email}
        required
      />

      <FormField
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password && errors.password}
        required
      />

      <FormButton 
        type="submit" 
        isLoading={isSubmitting}
      >
        Login
      </FormButton>
    </Form>
  );
}
```

## Testing Forms

Example of testing form validation:

```javascript
import { renderHook, act } from '@testing-library/react';
import { useForm } from '@/hooks/useForm';

test('validates email field', () => {
  const { result } = renderHook(() =>
    useForm(
      { email: '' },
      { email: 'email' },
      () => {}
    )
  );

  act(() => {
    result.current.setFieldValue('email', 'invalid');
    result.current.validate();
  });

  expect(result.current.errors.email).toBe('Invalid email format');
});
```

## Best Practices

1. **Use getFieldProps()** for most fields - cleaner code
2. **Show errors only for touched fields** - less overwhelming UX
3. **Use specific validators** - better validation messages
4. **Handle async validation** - for checking uniqueness
5. **Provide field help text** - guide users
6. **Disable submit button while submitting** - prevent double submission
7. **Show success/error toasts** - clear feedback

## Migration Guide

If updating existing forms:

1. Replace state management with `useForm`
2. Replace form components with `FormField`, `FormButton`, `Form`
3. Replace error handling with error utilities
4. Add toast notifications for feedback
5. Test form validation thoroughly

## API Documentation

See [API_DOCUMENTATION.md](../backend/API_DOCUMENTATION.md) for API endpoint details.
