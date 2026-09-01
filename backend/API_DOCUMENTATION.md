# API Documentation Guide

## Access Swagger UI

Once the backend is running, you can access the API documentation at:

```
http://localhost:5000/api-docs
```

## Features

The Swagger UI provides:
- **Complete endpoint documentation** - All API endpoints with descriptions and parameters
- **Request/Response examples** - See exact structure of requests and responses
- **Try it out** - Test endpoints directly from the browser
- **Authentication** - Support for testing authenticated endpoints with JWT tokens
- **Schema definitions** - Common data models (User, Employee, Payroll, etc.)

## API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /register` - Create new user account
- `POST /login` - Login with email and password
- `POST /refresh-token` - Get new access token from refresh token
- `GET /me` - Get current user profile
- `POST /forgot-password` - Request password reset email
- `POST /reset-password/{token}` - Reset password with token
- `POST /2fa/setup` - Setup two-factor authentication
- `POST /2fa/verify` - Enable 2FA with verification code
- `POST /2fa/verify-login` - Verify 2FA code during login
- `POST /2fa/disable` - Disable 2FA (requires password)

### Employees (`/api/employees`)
- `GET /` - List all employees
- `GET /{id}` - Get employee details
- `POST /` - Create new employee (admin/hr only)
- `PUT /{id}` - Update employee (admin/hr only)
- `DELETE /{id}` - Delete employee (admin only)

### Payroll (`/api/payroll`)
- `GET /` - List payroll records
- `GET /{id}` - Get payroll details
- `POST /` - Create payroll record (admin/hr/payroll only)
- `PUT /{id}` - Update payroll record (admin/hr/payroll only)

### HMO & Benefits (`/api/hmo`)
- `GET /plans` - List HMO plans
- `GET /enrollments` - List user enrollments
- `POST /enrollments` - Enroll in HMO plan
- `DELETE /enrollments/{id}` - Cancel enrollment

### Claims (`/api/claims`)
- `GET /` - List claims
- `POST /` - Submit new claim
- `PUT /{id}` - Update claim status

### Bonuses (`/api/bonuses`)
- `GET /` - List bonus plans
- `POST /` - Create bonus plan (admin/hr only)
- `PUT /{id}` - Update bonus plan

## Authentication

Most endpoints require JWT authentication. To test authenticated endpoints in Swagger:

1. Login using the `/api/auth/login` endpoint
2. Copy the `token` value from the response
3. Click the "Authorize" button at the top right
4. Paste the token and click "Authorize"
5. You can now test protected endpoints

## Testing Endpoints

### Example: Register and Login
1. Call `POST /api/auth/register` with name, email, password
2. Receive access token and refresh token
3. Use token in subsequent requests

### Example: Get Current User
1. Login to get access token
2. Call `GET /api/auth/me` with Authorization header
3. Receive current user profile

### Example: Refresh Token
1. Use the `refreshToken` from login
2. Call `POST /api/auth/refresh-token`
3. Receive new access token

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

Common status codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

The API has rate limiting configured:
- **General limit**: 100 requests per 15 minutes per IP
- **Login limit**: 5 attempts per 15 minutes per IP
- **Registration limit**: 3 attempts per hour per IP
- **Password reset limit**: 3 attempts per hour per IP

## CORS

The API accepts requests from configured origins. Configure in `.env`:
```
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

## Integration with Frontend

The frontend should:
1. Store the JWT token in localStorage or state management
2. Include token in Authorization header for all requests:
   ```javascript
   Authorization: Bearer <token>
   ```
3. Handle 401 responses by refreshing token or redirecting to login
4. Refresh token periodically or when access token expires

## Generating API Clients

You can generate API client code from the Swagger spec using tools like:
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Swagger Codegen](https://swagger.io/tools/swagger-codegen/)
- [Swagger UI libraries](https://github.com/swagger-api/swagger-ui)

## Next Steps

Add more detailed documentation by:
1. Adding JSDoc comments to remaining route files
2. Adding more example requests/responses
3. Documenting error codes and messages
4. Adding webhook documentation (if applicable)
