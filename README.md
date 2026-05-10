# 🍽️ FLAVOUR POS — Advanced Restaurant Management System

A full-stack, production-ready Restaurant POS & Management System built with **React + Node.js + MongoDB**.

---

## 🚀 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB (Mongoose ODM)              |
| Real-time  | Socket.io                           |
| WhatsApp   | Twilio WhatsApp API                 |
| Charts     | Recharts                            |
| Auth       | JWT (JSON Web Tokens)               |
| State      | Zustand                             |

---

## ✨ Features

### 🧾 POS (Point of Sale)
- Full-screen POS terminal with category navigation
- Real-time cart with qty controls, add-ons, special instructions
- Dine In / Delivery / Pickup order types
- Table selection for dine-in
- Customer info collection for delivery
- Discount (flat/percentage), tax calculation
- Multiple payment methods: Cash, Card, UPI

### 🍳 Kitchen Display System (KoT)
- Real-time Kitchen Order Tickets via Socket.io
- KoT priority system (Normal / High / Urgent)
- Item-level status tracking
- Prep timer with late-order alerts
- Sound alerts for new KoTs
- Waiter notification when order is ready

### 📋 Orders Management
- Full order lifecycle tracking
- Filter by status, type, date
- Payment processing with change calculation
- WhatsApp bill sending
- Order cancellation with reason

### 🪑 Tables & Floor Plan
- Visual table grid with real-time status
- Sections: Main Hall, Window Side, VIP, Outdoor
- Status: Available / Occupied / Reserved / Cleaning / Blocked
- Waiter request from table
- Live order info on occupied tables

### 📅 Reservations
- Create/Edit/Cancel reservations
- WhatsApp confirmation auto-sent
- Occasion tracking (Birthday, Anniversary, etc.)
- Table assignment
- Guest count and special requests

### 🛵 Delivery Management
- Delivery executive profiles
- Availability toggle
- Order assignment to executives
- Vehicle type and number tracking

### 📦 Inventory Management
- Stock tracking with units (kg, g, ltr, pcs, etc.)
- Low stock alerts (real-time via Socket.io)
- Stock transactions: In / Out / Waste / Adjustment
- Supplier management
- Cost per unit tracking

### 💸 Expenses
- Expense categories: Rent, Salaries, Utilities, Ingredients, etc.
- Payment method tracking
- Vendor/supplier records

### 📊 Reports & Analytics
- Revenue trends (7d / 30d / 90d)
- Orders per day bar chart
- Top selling items with progress bars
- Profit & Loss summary
- Payment method breakdown
- Order type distribution (Dine In / Delivery / Pickup)

### 👥 Staff Management
- Add staff with roles: Admin, Manager, Cashier, Waiter, Kitchen, Delivery
- Attendance: Punch In / Punch Out
- Salary tracking
- Shift management
- Active/Inactive toggle
- Role-based permissions

### 💰 Cash Register
- Open/Close register with opening balance
- Transaction recording (Deposit / Withdrawal)
- Auto-tracks cash sales from orders
- Closing balance reconciliation
- Discrepancy calculation

### ⚙️ Settings
- Restaurant profile (name, address, GSTIN, FSSAI)
- Tax settings (CGST, SGST, IGST, Service Charge)
- WhatsApp integration toggle
- Facility toggles (Dine In, Delivery, Pickup, Reservations)
- Bill print settings (header, footer, copies)

### 📲 WhatsApp Integration (via Twilio)
- Auto-send bill to customer after payment
- Reservation confirmation messages
- Order confirmation for delivery/pickup
- Custom message sending

---

## 📁 Project Structure

```
flavour-pos/
├── backend/
│   ├── controllers/      # Business logic
│   ├── middleware/        # Auth middleware
│   ├── models/           # MongoDB schemas
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── Menu.js        (Category + MenuItem)
│   │   ├── Order.js       (Order + KoT)
│   │   ├── Table.js       (Table + Reservation)
│   │   └── Operations.js  (Inventory, Expense, Attendance, DeliveryExec, CashRegister)
│   ├── routes/           # API routes
│   ├── socket/           # Real-time socket handlers
│   ├── utils/
│   │   ├── whatsapp.js   # Twilio WhatsApp service
│   │   └── seeder.js     # Demo data seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── Layout.jsx   # Sidebar + Topbar
│   │   ├── context/
│   │   │   ├── authStore.js     # Zustand auth state
│   │   │   └── SocketContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── POSPage.jsx
│   │   │   ├── OrdersPage.jsx
│   │   │   ├── TablesPage.jsx
│   │   │   ├── KitchenPage.jsx
│   │   │   ├── ReservationsPage.jsx
│   │   │   ├── DeliveryPage.jsx  (+ InventoryPage, ExpensesPage)
│   │   │   └── StaffPage.jsx     (+ ReportsPage, CashRegisterPage, SettingsPage)
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── utils/
│   │   │   └── api.js           # Axios instance
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── package.json         # Root (runs both simultaneously)
└── README.md
```

---

## ⚡ Quick Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Step 1 — Clone & Install

```bash
# Install all dependencies (root + backend + frontend)
npm run install:all
```

Or manually:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Step 2 — Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
MONGO_URI=mongodb://localhost:27017/flavour_pos
JWT_SECRET=your_super_secret_key_here
PORT=5000

# For WhatsApp bills (optional — get from twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Step 3 — Run the Project

```bash
# From root folder — starts both backend and frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### Step 4 — Login

The seeder auto-creates demo data on first run:

| Field    | Value                |
|----------|----------------------|
| Email    | admin@flavour.com    |
| Password | admin123             |

---

## 🔑 API Endpoints

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | /api/auth/register                | Register restaurant      |
| POST   | /api/auth/login                   | Login                    |
| GET    | /api/auth/me                      | Get current user         |
| GET    | /api/menu                         | Get menu items           |
| POST   | /api/menu                         | Add menu item            |
| GET    | /api/categories                   | Get categories           |
| GET    | /api/orders                       | List orders              |
| POST   | /api/orders                       | Create order             |
| PATCH  | /api/orders/:id/status            | Update order status      |
| POST   | /api/orders/:id/payment           | Process payment          |
| GET    | /api/orders/summary/today         | Today's dashboard stats  |
| GET    | /api/kot                          | Get kitchen KoTs         |
| PATCH  | /api/kot/:id/status               | Update KoT status        |
| GET    | /api/tables                       | Get all tables           |
| POST   | /api/reservations                 | Create reservation       |
| GET    | /api/delivery                     | Get delivery executives  |
| GET    | /api/inventory                    | Get inventory items      |
| POST   | /api/inventory/:id/transaction    | Update stock             |
| GET    | /api/expenses                     | Get expenses             |
| GET    | /api/staff                        | Get staff list           |
| POST   | /api/staff/attendance/punch       | Punch in/out             |
| GET    | /api/reports/sales                | Sales report             |
| GET    | /api/reports/top-items            | Top selling items        |
| GET    | /api/reports/profit-loss          | P&L report               |
| GET    | /api/cash-register/current        | Current open register    |
| POST   | /api/cash-register/open           | Open register            |
| POST   | /api/cash-register/close          | Close register           |
| POST   | /api/whatsapp/send-bill/:orderId  | Send WhatsApp bill       |
| GET    | /api/settings                     | Get restaurant settings  |
| PUT    | /api/settings                     | Save settings            |

---

## 🔌 Socket.io Events

| Event              | Direction       | Description                        |
|--------------------|-----------------|-----------------------------------|
| `join`             | Client → Server | Join restaurant room               |
| `new_order`        | Client → Server | New order placed                   |
| `kot_received`     | Server → Client | New KoT for kitchen                |
| `kot_status_update`| Both            | KoT status changed                 |
| `kot_ready`        | Server → Waiter | KoT ready for serving              |
| `waiter_request`   | Client → Server | Table requests waiter              |
| `waiter_called`    | Server → Waiters| Notify all waiters                 |
| `table_updated`    | Server → Client | Table status changed               |
| `order_status_changed` | Server → Client | Order status update            |
| `low_stock_alert`  | Server → Admin  | Inventory low stock                |
| `attendance_updated` | Server → Client | Staff punch in/out               |

---

## 📲 WhatsApp Setup (Twilio)

1. Sign up at [twilio.com](https://twilio.com)
2. Go to **Messaging → Try it out → Send a WhatsApp message**
3. Join the Twilio Sandbox by sending the shown code to their number
4. Get your **Account SID** and **Auth Token** from the console
5. Add to backend `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxx
   TWILIO_AUTH_TOKEN=xxxx
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```
6. Enable WhatsApp in Settings page of the app

---

## 🎨 Frontend Animations

All animations are powered by **Framer Motion**:
- Page transitions (fade + slide)
- Card hover effects (lift on hover)
- Staggered list animations
- KoT card entrance/exit animations
- Sidebar collapse with icon-only mode
- Loading shimmer effects
- Real-time KoT glow animation for urgent orders
- Notification pulse badge
- Animated progress bars in reports
- Login/Register step transitions

---

## 🏪 Supported Business Types

- 🍽️ Full Restaurants
- 🥘 Tiffin Centers
- ☕ Cafeterias
- 🍔 Fast Food Centers
- ☁️ Cloud Kitchens
- 🎂 Bakeries
- 🥤 Juice Centers

---

## 🔐 Role-Based Access

| Role       | Access Level                              |
|------------|-------------------------------------------|
| superadmin | Full access to everything                 |
| admin      | Full restaurant management                |
| manager    | Orders, menu, staff, reports              |
| cashier    | POS, orders, payment, cash register       |
| waiter     | Tables, orders, waiter requests           |
| kitchen    | Kitchen display only                      |
| delivery   | Delivery orders only                      |

---

## 🛠️ Customization Tips

1. **Add menu items** → Go to POS → items will appear after adding via MongoDB or building a menu management UI
2. **Change tax rates** → Settings → Tax & GST
3. **Add your logo** → Update `RESTAURANT_NAME` in `.env`
4. **Change theme color** → Edit `primary` color in `tailwind.config.js`
5. **Add new staff roles** → Update the enum in `User.js` model

---

## 📞 Support

Built with ❤️ for college project presentation.

**Stack:** React + Node.js + MongoDB + Socket.io + Twilio + Framer Motion

---

*FLAVOUR POS v1.0.0 — Advanced Restaurant Management System*
