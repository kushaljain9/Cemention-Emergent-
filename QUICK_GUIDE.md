# 🚀 CEMENTION - QUICK TESTING & EDITING GUIDE

## 📂 FILE LOCATIONS (Directory Tree)

```
/app/
├── backend/
│   ├── server.py                 ⭐ Main API (all endpoints)
│   ├── config.py                 ⭐ Company settings (edit here!)
│   ├── .env                      🔐 Database & secrets
│   ├── requirements.txt          📦 Python packages
│   └── utils/
│       ├── gst_validator.py      ✅ GST validation
│       ├── invoice_generator.py  📄 PDF invoices
│       └── notifications.py      📱 WhatsApp/Email
│
├── frontend/
│   ├── package.json              📦 Node packages
│   ├── tailwind.config.js        🎨 Design config
│   ├── .env                      🔐 API endpoint
│   └── src/
│       ├── App.js                ⭐ Main app
│       ├── index.js              🚪 Entry point
│       ├── index.css             🎨 Global styles
│       ├── contexts/
│       │   └── AuthContext.js    🔐 Authentication
│       ├── utils/
│       │   └── api.js            🌐 API calls
│       ├── components/
│       │   ├── Navbar.js         📍 Top navigation
│       │   ├── Footer.js         📍 Footer
│       │   ├── ChatBot.js        💬 Chatbot
│       │   └── ui/               🎨 UI components
│       └── pages/
│           ├── Landing.js        🏠 Home page
│           ├── Login.js          🔐 Login
│           ├── Register.js       📝 Sign up
│           ├── Products.js       🛍️ Product catalog
│           ├── Cart.js           🛒 Shopping cart
│           ├── Checkout.js       💳 Payment
│           ├── Profile.js        👤 User profile
│           └── Admin.js          ⚙️ Admin panel
│
├── invoices/                     📄 Generated PDFs
└── PROJECT_STRUCTURE.md          📚 This guide
```

## 🎯 WHAT TO TEST

### ✅ User Flow Testing
1. **Registration** → http://localhost:3000/register
   - Try all 3 roles: Dealer, Retailer, Customer
   - Test with GST registration ON/OFF
   
2. **Login** → http://localhost:3000/login
   - Use test accounts (see credentials below)
   
3. **Browse Products** → http://localhost:3000/products
   - Check role-based pricing
   - Add items to cart (minimum 100 bags)
   
4. **Cart** → http://localhost:3000/cart
   - Adjust quantities
   - Remove items
   
5. **Checkout** → http://localhost:3000/checkout
   - Fill delivery address
   - Try different payment methods
   - Enter transaction ID
   - Check GST calculation
   
6. **Profile** → http://localhost:3000/profile
   - View order history
   - Check request orders
   
7. **Admin Panel** → http://localhost:3000/admin
   - Login as admin
   - Add/edit/delete products
   - Manage users
   - Update order status

### 🔐 Test Credentials

**Admin:**
- Email: admin@cemention.com
- Password: admin123

**Retailer:**
- Email: retailer@test.com
- Password: password123

**Customer:**
- Email: customer@test.com
- Password: pass123

## ✏️ COMMON EDITS

### 1️⃣ Change Company Details
```bash
nano /app/backend/config.py
```
Edit: Phone, UPI, Bank details, GST number, etc.

### 2️⃣ Change Prices
```bash
nano /app/backend/config.py
```
Look for `PRICING_MULTIPLIER` section

### 3️⃣ Edit Product Page
```bash
nano /app/frontend/src/pages/Products.js
```

### 4️⃣ Edit Checkout Flow
```bash
nano /app/frontend/src/pages/Checkout.js
```

### 5️⃣ Change Colors/Fonts
```bash
nano /app/frontend/tailwind.config.js
nano /app/frontend/src/index.css
```

### 6️⃣ Edit Footer Content
```bash
nano /app/frontend/src/components/Footer.js
```

### 7️⃣ Modify Chatbot Messages
```bash
nano /app/frontend/src/components/ChatBot.js
```

## 🔄 After Making Changes

```bash
# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Check if running
sudo supervisorctl status

# View logs (if issues)
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
```

## 🧪 API Testing (Optional)

### Test Product List
```bash
curl http://localhost:8001/api/products
```

### Test Login
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"pass123"}'
```

### Test Cart (need token from login)
```bash
TOKEN="your-token-here"
curl http://localhost:8001/api/cart \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Database Access

Your MongoDB is at: `mongodb://localhost:27017`
Database name: `test_database`

Collections:
- users
- products
- carts
- orders
- request_orders

## 🎨 Design System

**Fonts:**
- Headings: Chivo (bold, uppercase)
- Body text: Manrope

**Colors:**
- Primary: Slate-900 (dark)
- Accent: Orange-500
- Background: White/Slate-50

## 📱 Features Implemented

✅ User registration with role selection
✅ GST registration option
✅ Role-based pricing (Dealer/Retailer/Customer)
✅ Product catalog with images
✅ Shopping cart (100 bags minimum)
✅ Multiple payment options
✅ Transaction ID tracking
✅ Order management
✅ Request orders
✅ Admin panel
✅ Simple chatbot
✅ Invoice generation (PDF)
✅ WhatsApp notification templates
✅ Professional design

## 🐛 Troubleshooting

**Issue: Changes not reflecting**
```bash
sudo supervisorctl restart backend frontend
```

**Issue: Service not running**
```bash
sudo supervisorctl status
sudo supervisorctl start backend
sudo supervisorctl start frontend
```

**Issue: Port already in use**
```bash
sudo supervisorctl stop all
sudo supervisorctl start all
```

**Issue: Need to see errors**
```bash
tail -n 100 /var/log/supervisor/backend.err.log
tail -n 100 /var/log/supervisor/frontend.err.log
```

## 📞 Quick Reference

**Frontend URL:** http://localhost:3000
**Backend API:** http://localhost:8001/api
**Admin Email:** admin@cemention.com
**Company Phone:** 9823064024
**WhatsApp:** 8237564024
**UPI:** 9823064024@ybl

---

**Need help?** All files are in `/app/` directory!
