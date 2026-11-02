# Pharsyde Backend API

A robust, production-ready REST API built with Node.js, Express, MySQL 2, JWT authentication, and bcrypt password hashing.

---

## 📁 Project Structure

```
Backend/
├── config/
│   ├── db.js             # MySQL2 connection pool setup & test
│   └── schema.sql        # MySQL table schema for reference
├── controllers/
│   ├── authController.js    # Register, login, user profile logic
│   └── productController.js # CRUD handlers & TechPOS sync
├── middlewares/
│   ├── authMiddleware.js    # JWT verification & role authorization
│   └── errorMiddleware.js   # 404 handler & global error handler
├── models/
│   ├── index.js          # Aggregator & initModelTables() executor
│   ├── userModel.js      # Users table schema & queries
│   ├── productModel.js   # Products table schema & high-performance bulk upsert
│   └── productImageModel.js # TechPOS image repository & sync joins
├── routes/
│   ├── authRoutes.js     # /api/auth routes
│   └── productRoutes.js  # /api/products routes
├── scripts/
│   ├── syncProducts.js      # CLI script to populate products from TechPOS API
│   ├── syncProductImages.js # CLI script to sync images directly to MySQL
│   └── sync_techpos_images.py # Python alternative for direct image sync
├── services/
│   ├── techposService.js      # TechPOS OpenAPI fetcher & base product sync
│   └── techposImageService.js # TechPOS WebMenu eapi image sync service
├── utils/
│   └── jwt.js            # JWT token generation & verification
├── .env                  # Environment variables & TechPOS API keys
├── .env.example          # Sample environment configuration
├── .gitignore            # Git ignore rules
├── package.json          # Node dependencies & npm scripts
└── index.js              # Main server startup file
```

---

## 🚀 Getting Started & Populating Data

### 1. Configure Environment (`.env`)
Make sure your MySQL database name and credentials are set in `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pharsyde_db
DB_PORT=3306

# TechPOS API Integration
TECHPOS_API_URL=https://integrations-api.techpos.ca/467-41/api/openAPI/allProducts/1
TECHPOS_API_KEY=Ym9KsXaM3M7W2B301iI3ynU1
```

### 2. Populate Products & Sync Images Directly
No Excel or CSV downloads required. The services stream directly to MySQL:

- **Sync Base Products (OpenAPI):**
  ```bash
  npm run sync
  ```
- **Sync Product Images (WebMenu eapi):**
  ```bash
  npm run sync:images
  ```
- **Sync Both in Sequence:**
  ```bash
  npm run sync:all
  ```

Alternatively, trigger synchronization via API:
- `POST` or `GET` `/api/products/sync-techpos` (Base catalog)
- `POST` or `GET` `/api/products/sync-images` (Product images)
- `POST` or `GET` `/api/products/sync-all` (Full catalog + images)

### 3. Start the Server
```bash
npm run dev
```

---

## 📡 API Endpoints

### 🛍️ Products (`/api/products`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/products/sync-techpos` | Populate base products from TechPOS OpenAPI |
| `GET` / `POST` | `/api/products/sync-images` | Direct image sync from TechPOS WebMenu into DB |
| `GET` / `POST` | `/api/products/sync-all` | Combined base products + image sync |
| `GET` | `/api/products` | Query products (`category`, `subCategory`, `brand`, `strain`, `search`, etc.) |
| `GET` | `/api/products/meta/categories` | Distinct categories list |
| `GET` | `/api/products/meta/brands` | Distinct brands list |
| `GET` | `/api/products/:id` | Get single product by `pk`, `sku`, or `barcode` |
| `POST` | `/api/products` | Create or upsert single product |
| `POST` | `/api/products/bulk` | Bulk upsert custom JSON array |
| `PUT` | `/api/products/:id` | Update product by `pk` |
| `DELETE` | `/api/products/:id` | Delete product by `pk` |

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Login & receive JWT | Public |
| `GET` | `/api/auth/me` | Current user profile | `Bearer <token>` |
| `GET` | `/api/auth/users` | List all users | `Bearer <token>` (Admin) |
