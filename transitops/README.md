# TransitOps — Smart Transport Operations Platform

## Tech Stack

- **Frontend**: Angular 17
- **Backend**: Node.js + Express
- **Database**: MongoDB

---

## Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally (or update MONGO_URI to point to Atlas)
- Angular CLI: `npm install -g @angular/cli`

---

### Backend

```bash
cd backend
npm install

# Copy env file and configure
cp .env.example .env
# (Edit .env if needed — default MONGO_URI is mongodb://localhost:27017/transitops)

# Seed demo data
npm run seed

# Start server
npm run dev
# → API running at http://localhost:3000
```

---

### Frontend

```bash
cd frontend
npm install
ng serve
# → App running at http://localhost:4200
```

---

## Demo Login Credentials

| Role              | Email                   | Password    |
| ----------------- | ----------------------- | ----------- |
| Fleet Manager     | fleet@transitops.com    | password123 |
| Dispatcher        | dispatch@transitops.com | password123 |
| Safety Officer    | safety@transitops.com   | password123 |
| Financial Analyst | finance@transitops.com  | password123 |

---

## Features

### Mandatory

- ✅ Secure login with JWT + RBAC
- ✅ Dashboard with 9 live KPIs
- ✅ Vehicle Registry — CRUD, CSV export, status management
- ✅ Driver Management — CRUD, license expiry warnings, safety scores
- ✅ Trip Management — Create → Dispatch → Complete / Cancel lifecycle
- ✅ Automatic status transitions (vehicle + driver)
- ✅ Maintenance workflow — creates "In Shop" status, restore on close
- ✅ Fuel & Expense tracking with auto-computed costs

### Business Rules Enforced

- Retired / In Shop vehicles excluded from dispatch
- Suspended drivers and expired licenses blocked from assignment
- Cargo weight validated against vehicle capacity
- Driver / vehicle already On Trip cannot be reassigned

### Bonus

- ✅ Charts (fuel efficiency, cost vs revenue) via Chart.js
- ✅ CSV export on Vehicles, Drivers, Fuel Logs, Analytics
- ✅ License expiry warnings (badge + dashboard counter)
- ✅ Filters, search, and sorting on all list screens
