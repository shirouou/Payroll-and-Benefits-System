# Oxford Suites Makati - Payroll & Benefits System

Complete full-stack application for managing employee payroll, benefits, HMO enrollment, and insurance claims.

## Project Structure

```
PAYROLL AND BENEFITS/
├── backend/              # Node.js/Express API
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Express middleware
│   ├── config/          # Configuration
│   ├── utils/           # Helper functions
│   ├── server.js        # Server entry point
│   └── package.json     # Backend dependencies
│
├── frontend/            # React/Vite web application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API client
│   │   ├── styles/      # CSS files
│   │   ├── utils/       # Helper functions
│   │   └── App.jsx      # Root component
│   ├── public/          # Static assets
│   └── package.json     # Frontend dependencies
│
└── payroll-benefits-system.html  # Original UI reference
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm (v6+)
- MongoDB (running locally or connection string)

### Quick Start

#### 1. Backend Setup
copy .env.example .env

```bash
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Configure MongoDB in .env
# MONGODB_URI=mongodb://localhost:27017/payroll-benefits

# Start server
npm start
```

Server will run on: `http://localhost:5000`
API health check: `http://localhost:5000/health`

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Start development server
npm run dev
```

Application will run on: `http://localhost:3000`

## Features

### Employee Management
- Add, edit, delete employees
- Track employee status (Active, Inactive, On Leave, Suspended)
- Store government IDs (SSS, PhilHealth, Pag-IBIG, TIN)
- Manage salary and allowances

### Payroll Processing
- Create payroll entries
- Automatic calculation of:
  - SSS contributions (4.5%)
  - PhilHealth deductions (2.5%)
  - Pag-IBIG contributions (2%)
  - Withholding tax (BIR computation)
- Run batch payroll for all active employees
- Track payroll status (Draft, Approved, Paid, Voided)

### HMO & Benefits Administration
- Create and manage HMO plans
- Define coverage and monthly premiums
- Enroll employees in plans
- Track dependents
- Monitor enrollment status

### Insurance Claims Management
- Submit claims
- Approval workflow
- Track claim status (Pending, Approved, Rejected, Paid)
- Manage approved and claimed amounts

### Bonus Management
- Create bonus plans
- Configure bonus types (Fixed, Percentage, Performance)
- Set applicable departments/positions
- Schedule bonus months

## API Endpoints

### Employees
```
GET    /api/employees              - List all employees
POST   /api/employees              - Create employee
GET    /api/employees/:id          - Get employee details
PUT    /api/employees/:id          - Update employee
DELETE /api/employees/:id          - Delete employee
GET    /api/employees/status/:status - Filter by status
```

### Payroll
```
GET    /api/payroll                - List all payroll records
POST   /api/payroll                - Create payroll entry
GET    /api/payroll/:id            - Get payroll details
PUT    /api/payroll/:id            - Update payroll
DELETE /api/payroll/:id            - Delete payroll
GET    /api/payroll/period/:period - Get payroll by period
POST   /api/payroll/run/batch      - Run batch payroll
```

### HMO Plans
```
GET    /api/hmo/plans              - List HMO plans
POST   /api/hmo/plans              - Create plan
PUT    /api/hmo/plans/:id          - Update plan
DELETE /api/hmo/plans/:id          - Delete plan
```

### HMO Enrollments
```
GET    /api/hmo/enrollments        - List all enrollments
POST   /api/hmo/enrollments        - Create enrollment
GET    /api/hmo/enrollments/employee/:id - Get employee enrollments
PUT    /api/hmo/enrollments/:id    - Update enrollment
DELETE /api/hmo/enrollments/:id    - Delete enrollment
```

### Claims
```
GET    /api/claims                 - List all claims
POST   /api/claims                 - Create claim
GET    /api/claims/:id             - Get claim details
PUT    /api/claims/:id             - Update claim
POST   /api/claims/:id/approve     - Approve claim
POST   /api/claims/:id/reject      - Reject claim
GET    /api/claims/status/:status  - Filter by status
```

### Bonuses
```
GET    /api/bonuses                - List bonus plans
POST   /api/bonuses                - Create bonus plan
GET    /api/bonuses/:id            - Get bonus details
PUT    /api/bonuses/:id            - Update bonus plan
DELETE /api/bonuses/:id            - Delete bonus plan
```

## Database Schema

### Employees
- name, email, position, department
- basicSalary, allowance
- dateHired, status
- bankAccount, phone, address
- Government IDs (SSS, PhilHealth, Pag-IBIG, TIN)

### Payroll
- employeeId, paymentPeriod
- basicSalary, allowance, overtime, bonus
- grossSalary, deductions, netPay
- Contributions: SSS, PhilHealth, Pag-IBIG, withholding tax
- status, dateProcessed

### HMOPlan
- name, description
- coverage (annual), premium (monthly)
- status

### HMOEnrollment
- employeeId, planId
- dependents count, dateEnrolled
- status

### Claim
- enrollmentId, employeeId
- claimDate, serviceDate
- provider, description
- claimAmount, approvedAmount
- status, notes

### BonusPlan
- name, bonusType
- amount, applicableTo
- bonusMonth, status

## Calculations

### Withholding Tax (BIR Simplified)
```
≤ ₱13,333: 0%
₱13,334 - ₱41,666: 5%
₱41,667 - ₱83,333: 10%
₱83,334 - ₱250,000: 15%
> ₱250,000: 20%
```

### Contributions
- SSS: 4.5% of basic salary
- PhilHealth: 2.5% of basic salary
- Pag-IBIG: 2% of basic salary (max ₱100)

### 13th Month Pay
```
(Basic Salary / 12) × Months Worked
```

## Frontend Pages

### Dashboard
- KPI cards with key metrics
- Recent payroll records
- System overview

### Employees
- List all employees with CRUD operations
- Filter and search
- Status management

### Payroll
- View payroll records by period
- Create manual entries
- Run batch payroll
- View detailed calculations

### HMO & Benefits
- Manage HMO plans
- Enroll employees
- Track enrollment status
- Monitor premiums

## Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication (future)
- **Joi** - Validation

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **CSS3** - Styling

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/payroll-benefits
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start Vite dev server with HMR
```

### Build for Production

Backend:
```bash
# Backend is ready to deploy as-is
npm start
```

Frontend:
```bash
npm run build        # Creates optimized build in dist/
npm run preview      # Preview production build locally
```

## Future Enhancements

- ✅ Employee management
- ✅ Payroll processing
- ✅ HMO administration
- ✅ Claims management
- ⬜ Authentication & authorization
- ⬜ PDF payslip generation
- ⬜ Email notifications
- ⬜ Advanced reporting
- ⬜ Data export (CSV, Excel)
- ⬜ 13th month calculator
- ⬜ Mobile app
- ⬜ Dark mode
- ⬜ Multi-language support

## Troubleshooting

### Backend Connection Issues
1. Ensure MongoDB is running
2. Check MONGODB_URI in .env
3. Verify port 5000 is available

### Frontend API Errors
1. Confirm backend is running on port 5000
2. Check REACT_APP_API_URL in .env.local
3. Open browser console for detailed errors

### CORS Issues
- Backend CORS is configured for `http://localhost:3000`
- Update vite.config.js proxy if needed

## Support

For issues or questions:
1. Check README files in backend/ and frontend/
2. Review error messages in console
3. Check browser network tab for API responses

## License

Proprietary - Oxford Suites Makati © 2026

## Authors

- System Design & Development
- Oxford Suites Makati Management
