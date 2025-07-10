# Moon Land POS System

A modern Point of Sale (POS) system built with React and MySQL, designed for bars and restaurants.

## Features

### For Cashiers:
- Menu grid interface for taking orders
- Shopping cart functionality
- Payment processing (Cash, Card, Credit)
- Shift management
- Expense tracking
- Real-time sales tracking

### For Administrators:
- Sales reports and analytics
- Inventory management with low stock alerts
- Staff management
- Credit sales management
- Expense tracking
- PDF report generation

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT with bcrypt
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup Instructions

### 1. Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE moonland_pos;
```

2. Copy the environment file:
```bash
cp env.example .env
```

3. Update the `.env` file with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=moonland_pos
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

Start both the backend and frontend:
```bash
npm run dev:full
```

Or start them separately:

Backend only:
```bash
npm run server
```

Frontend only:
```bash
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Default Login

The system automatically creates a default admin account:

- **Email**: admin@moonland.com
- **Password**: admin123

## Database Schema

The system automatically creates the following tables:

### Users
- Authentication and user management
- Role-based access (admin/cashier)

### Categories
- Product categories for organization

### Inventory
- Product management with stock tracking
- Low stock alerts

### Sales
- Transaction records with payment methods
- Credit sales support

### Expenses
- Expense tracking by cashier

### Shifts
- Cashier shift management

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Add new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `PUT /api/inventory/:id/stock` - Update stock

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id/pay` - Mark credit sale as paid

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Add new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Add new expense

### Staff
- `GET /api/staff` - Get all staff members

## Development

### Project Structure

```
superbase/
├── server/                 # Backend API
│   └── index.js           # Express server
├── src/
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── lib/              # Utilities and API client
│   ├── pages/            # Page components
│   └── App.jsx           # Main app component
├── package.json
└── README.md
```

### Adding New Features

1. **Backend**: Add new routes in `server/index.js`
2. **Frontend**: Add new API methods in `src/lib/api.js`
3. **Context**: Update `src/contexts/POSContext.jsx` for state management
4. **Components**: Create new UI components in `src/components/`

## Production Deployment

1. Build the frontend:
```bash
npm run build
```

2. Set up environment variables for production
3. Configure your MySQL database for production
4. Set up a reverse proxy (nginx) to serve the frontend and proxy API requests
5. Use PM2 or similar to manage the Node.js process

## Security Considerations

- Change the default JWT secret in production
- Use HTTPS in production
- Implement proper input validation
- Set up database backups
- Use environment variables for sensitive data

## License

This project is licensed under the MIT License. 