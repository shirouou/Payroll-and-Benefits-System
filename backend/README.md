# Payroll & Benefits System - Backend API

A comprehensive Node.js/Express backend for managing employee payroll, HMO benefits, claims, and bonuses for Oxford Suites Makati.

## Features

- **Employee Management**: Add, update, and manage employee records
- **Payroll Processing**: Calculate and process monthly payroll with deductions
- **HMO & Benefits**: Manage HMO plans and employee enrollment
- **Claims Management**: Process and approve insurance claims
- **Bonus Management**: Configure and track bonus plans
- **Automated Calculations**: SSS, PhilHealth, Pag-IBIG, and withholding tax

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB connection string and settings

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Database seeding

To populate the database with sample data run the seed script:
```bash
npm run seed
```

### Production start

Use the production start script to run the server in a production environment (ensure `NODE_ENV` is set appropriately in your hosting environment):
```bash
NODE_ENV=production npm run start:prod
```

When `NODE_ENV=production`, the backend will automatically serve the frontend build from `../frontend/dist/` directory. Ensure you have run `npm run build` in the frontend folder first to generate the production bundle.

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/status/:status` - Get employees by status

### Payroll
- `GET /api/payroll` - Get all payroll records
- `GET /api/payroll/:id` - Get payroll record
- `GET /api/payroll/period/:period` - Get payroll by period
- `POST /api/payroll` - Create payroll record
- `PUT /api/payroll/:id` - Update payroll record
- `DELETE /api/payroll/:id` - Delete payroll record
- `POST /api/payroll/run/batch` - Run batch payroll

### HMO & Benefits
- `GET /api/hmo/plans` - Get all HMO plans
- `POST /api/hmo/plans` - Create HMO plan
- `PUT /api/hmo/plans/:id` - Update HMO plan
- `DELETE /api/hmo/plans/:id` - Delete HMO plan
- `GET /api/hmo/enrollments` - Get all enrollments
- `GET /api/hmo/enrollments/employee/:employeeId` - Get employee enrollments
- `POST /api/hmo/enrollments` - Create enrollment
- `PUT /api/hmo/enrollments/:id` - Update enrollment
- `DELETE /api/hmo/enrollments/:id` - Delete enrollment

### Claims
- `GET /api/claims` - Get all claims
- `GET /api/claims/:id` - Get claim by ID
- `POST /api/claims` - Create claim
- `PUT /api/claims/:id` - Update claim
- `POST /api/claims/:id/approve` - Approve claim
- `POST /api/claims/:id/reject` - Reject claim
- `GET /api/claims/status/:status` - Get claims by status

### Bonuses
- `GET /api/bonuses` - Get all bonus plans
- `GET /api/bonuses/:id` - Get bonus plan
- `POST /api/bonuses` - Create bonus plan
- `PUT /api/bonuses/:id` - Update bonus plan
- `DELETE /api/bonuses/:id` - Delete bonus plan

## Database Models

### Employee
- name, email, position, department
- basicSalary, allowance
- dateHired, status
- bankAccount, phone, address
- SSS, PhilHealth, Pag-IBIG numbers

### Payroll
- employeeId, paymentPeriod
- basicSalary, allowance, overtime, bonus
- grossSalary, deductions, netPay
- SSS, PhilHealth, Pag-IBIG, withholding tax

### HMOPlan
- name, description
- coverage, premium
- status

### HMOEnrollment
- employeeId, planId
- dependents, dateEnrolled
- status

### Claim
- enrollmentId, employeeId
- claimDate, serviceDate
- provider, description
- claimAmount, approvedAmount
- status

### BonusPlan
- name, bonusType
- amount, applicableTo
- bonusMonth, status

## Calculation Features

- **Withholding Tax**: BIR simplified computation
- **SSS Contribution**: 4.5% of basic salary
- **PhilHealth**: 2.5% of basic salary
- **Pag-IBIG**: 2% of basic salary (max ₱100)
- **Net Pay**: Gross salary minus all deductions

## Error Handling

The API includes comprehensive error handling with:
- Custom error classes
- Validation error messages
- HTTP status codes
- Consistent error response format

## Response Format

All responses follow this format:
```json
{
  "success": true/false,
  "data": {},
  "message": "Success message or error description"
}
```

## Environment Variables

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/payroll-benefits
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

## Future Enhancements

- Authentication & Authorization
- Email notifications
- PDF payslip generation
- Data export (CSV, Excel)
- Advanced reporting
- Audit logs
- Multi-company support
- Mobile app integration

## License

Proprietary - Oxford Suites Makati
