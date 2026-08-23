# Payroll & Benefits System - Frontend

A modern React/Vite frontend for the Oxford Suites Makati Payroll & Benefits System.

## Features

- **Dashboard** - Overview of employees, payroll, and system metrics
- **Employee Management** - CRUD operations for employee records
- **Payroll Processing** - Run payroll, view records, manage deductions
- **HMO & Benefits** - Manage plans and employee enrollments
- **Responsive Design** - Works on desktop and tablet devices
- **Real-time Updates** - Integrated with backend API

## Tech Stack

- **React 18** - UI framework
- **Vite** - Fast build tool
- **React Router** - Client-side navigation
- **Axios** - HTTP client
- **CSS3** - Styling with custom design system

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

## Build for Production

Build the frontend bundle:
```bash
npm run build
```

The build output will be in the `dist/` directory.

**To serve with backend:** Copy the `dist/` folder contents into `backend/public/` or ensure the backend is configured to serve static files from `../frontend/dist/` (see backend `server.js` for production setup).

Then run the backend with:
```bash
NODE_ENV=production npm run start:prod
```

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── services/        # API integration
│   ├── hooks/           # Custom React hooks
│   ├── context/         # React context (for state management)
│   ├── styles/          # CSS files
│   ├── utils/           # Helper functions
│   ├── App.jsx          # Root component
│   └── main.jsx         # Entry point
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## API Integration

The frontend connects to the backend API at `http://localhost:5000/api`

API endpoints are organized in `src/services/api.js`:
- Employees: `/api/employees`
- Payroll: `/api/payroll`
- HMO: `/api/hmo`
- Claims: `/api/claims`
- Bonuses: `/api/bonuses`

## Pages

### Dashboard
- KPI cards showing key metrics
- Recent payroll records
- System overview

### Employees
- View all employees
- Add new employees
- Edit employee information
- Delete employees
- Filter by status

### Payroll
- View payroll records by period
- Create manual payroll entries
- Run batch payroll for all employees
- View deductions and net pay calculations

### HMO & Benefits
- Manage HMO plans
- Enroll employees in plans
- Track enrollment status
- Manage plan coverage and premiums

## Components

- **Card** - Container component with title and actions
- **Table** - Data table with sorting and actions
- **Button** - Reusable button component with variants
- **Modal** - Dialog for forms and confirmations

## Utilities

### Helpers (`src/utils/helpers.js`)
- `formatPeso()` - Format numbers as Philippine Pesos
- `formatDate()` - Format dates
- `calculate13thMonth()` - Calculate 13th month pay
- `calculateMonthsWorked()` - Calculate tenure
- `getCurrentMonthYear()` - Get current period

### Hooks (`src/hooks/useFetch.js`)
- `useFetch()` - Hook for API calls
- `useAsync()` - Generic async operations

## Styling

The application uses a custom design system with CSS variables:
- Navy, Brass, Linen colors
- Consistent spacing and typography
- Responsive grid layouts
- Shadow and border utilities

## Environment Variables

Create `.env.local` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Development Tips

1. Use React DevTools browser extension for debugging
2. Open network tab to monitor API calls
3. Check console for errors and warnings
4. Use Vite's fast refresh during development

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Authentication & login page
- Role-based access control
- Advanced reporting & analytics
- PDF export for payslips
- Email notifications
- Dark mode
- Mobile app
- Real-time notifications
- Data visualization (charts & graphs)

## License

Proprietary - Oxford Suites Makati
