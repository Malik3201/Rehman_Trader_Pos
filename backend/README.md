# Rehman Trader POS - Backend API

## Sales + Ledger Engine Implementation

This backend implements a complete sales and ledger management system with atomic transactions, invoice generation, and comprehensive reporting.

## Environment Variables

**Important:** Copy `temp.env` to `.env` and fill in your actual values.

See `temp.env` file for all required environment variables.

**Required Variables:**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)

See `temp.env` for complete list of all environment variables.

## Installation

```bash
cd backend
npm install
```

## Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Sales

#### Create Retail Sale
```
POST /api/v1/sales/retail
Authorization: Bearer <token>
Body: {
  items: [{ productId: string, qty: number }],
  paymentReceived?: number,
  paymentMethod?: 'cash' | 'bank' | 'other',
  discount?: number,
  notes?: string
}
```

#### Create Wholesale Sale
```
POST /api/v1/sales/wholesale
Authorization: Bearer <token>
Body: {
  customerId: string,
  items: [{ productId: string, qty: number, unitPrice?: number }],
  paymentReceived?: number,
  paymentMethod?: 'cash' | 'bank' | 'other',
  discount?: number,
  notes?: string
}
```

#### Get Sales List
```
GET /api/v1/sales?type=retail|wholesale&from=YYYY-MM-DD&to=YYYY-MM-DD&customerId=string&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Sale by ID
```
GET /api/v1/sales/:id
Authorization: Bearer <token>
```

#### Get Invoice PDF (Wholesale Only)
```
GET /api/v1/sales/:id/invoice.pdf
Authorization: Bearer <token>
Returns: PDF file
```

### Payments

#### Create Standalone Payment
```
POST /api/v1/payments
Authorization: Bearer <token>
Body: {
  customerId: string,
  amount: number,
  method?: 'cash' | 'bank' | 'other',
  note?: string
}
```

### Stock

#### Adjust Stock (Admin Only)
```
POST /api/v1/stock/adjust
Authorization: Bearer <token> (Admin role required)
Body: {
  productId: string,
  qtyChange: number (positive or negative),
  reason?: string
}
```

### Reports

#### Daily Summary
```
GET /api/v1/reports/daily?date=YYYY-MM-DD
Authorization: Bearer <token>
Returns: {
  date: string,
  totalRetailSales: number,
  totalWholesaleSales: number,
  totalCashReceived: number,
  totalCreditAdded: number,
  topSellingItems: Array<{ productId, name, qty }>
}
```

### Customer Ledger

#### Get Customer Ledger
```
GET /api/v1/customers/:id/ledger?from=YYYY-MM-DD&to=YYYY-MM-DD
Authorization: Bearer <token>
Returns: Array of ledger entries with running balance
```

### OCR/AI Purchase Import

#### Import Purchase from Receipt/Invoice
```
POST /api/v1/purchases/import
Authorization: Bearer <token> (Admin only)
Content-Type: multipart/form-data
Body: {
  image: <file> (JPEG, PNG, WebP)
}
Returns: PurchaseDraft with parsed items and product matches
```

#### Get Purchase Drafts
```
GET /api/v1/purchases/drafts?status=draft&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Purchase Draft by ID
```
GET /api/v1/purchases/drafts/:id
Authorization: Bearer <token>
```

#### Approve Purchase Draft
```
POST /api/v1/purchases/drafts/:id/approve
Authorization: Bearer <token> (Admin only)
Body: {
  mappingDecisions: [
    {
      action: 'use_existing' | 'create_new' | 'merge_pending',
      productId?: string,
      productFields?: { name, unitType, costPrice, retailPrice, wholesalePrice },
      pendingProductId?: string
    }
  ]
}
```

### Purchases

#### Get Purchases List
```
GET /api/v1/purchases?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Purchase by ID
```
GET /api/v1/purchases/:id
Authorization: Bearer <token>
```

### WhatsApp Share

#### Get WhatsApp Share Link
```
GET /api/v1/sales/:id/share
Authorization: Bearer <token>
Returns: {
  pdfUrl: string,
  whatsappLink: string,
  messageText: string,
  customerPhone: string
}
```
**Note:** Returns a WhatsApp "click to chat" link but does NOT send messages automatically.

## Features

### Atomic Transactions
- All sales operations use MongoDB transactions to ensure data consistency
- Stock updates, ledger entries, and customer balance updates are atomic
- Prevents negative stock and balance inconsistencies

### Ledger Management
- Automatic customer balance updates for wholesale sales
- Standalone payment recording
- Complete audit trail via StockLedger
- Running balance calculation in customer ledger

### Invoice Generation
- PDF invoice generation for wholesale sales
- Includes shop information, customer details, items, and balance information
- Uses PDFKit for professional invoice formatting

### Error Handling
- Comprehensive error handling with proper HTTP status codes
- Consistent error response format
- Detailed error messages for debugging

## Business Logic

### Retail Sales
- Walk-in customers (no customerId required)
- Uses Product.retailPrice
- Reduces stock immediately
- No ledger balance impact

### Wholesale Sales
- Requires customerId
- Uses Product.wholesalePrice (or retailPrice fallback)
- Reduces stock immediately
- Updates customer balance: `newBalance = previousBalance + grandTotal - paymentReceived`
- Stores balance snapshot in Sale.ledgerEffect

### Payments
- Standalone payments reduce customer balance
- Can result in negative balance (overpayment allowed)
- Creates Payment record for audit trail

### Stock Adjustments
- Admin-only manual stock adjustments
- Creates StockLedger entry with type 'adjustment'
- Prevents negative stock

## Data Models

- **Sale**: Contains sale items, totals, payment info, and ledger effect snapshot
- **SaleItem**: Subdocument with product snapshot (name, unitType, prices)
- **Payment**: Standalone payment records
- **StockLedger**: Complete audit trail of all stock movements
- **Customer**: Maintains currentBalance field updated atomically

## Security

- JWT authentication required for all endpoints
- Role-based access control (Admin/Cashier)
- Input validation using Zod schemas
- Rate limiting on API routes
- Helmet for security headers
- CORS configuration

## OCR/AI Pipeline

### Purchase Import Flow

1. **Upload Receipt Image**: Admin uploads receipt/invoice image
2. **OCR Extraction**: Text is extracted from image (requires `ENABLE_OCR=true`)
3. **AI Parsing**: Structured data is extracted using configured AI provider
4. **Product Matching**:
   - Exact barcode/SKU match → auto-match (confidence: 1.0)
   - Name/alias similarity ≥70% → auto-match
   - Otherwise → create PendingProduct entry
5. **Draft Creation**: PurchaseDraft created with status 'draft'
6. **Admin Review**: Admin reviews draft and resolves pending products
7. **Approval**: Admin approves draft → creates Purchase, updates stock, writes StockLedger

### AI Provider Configuration

The system supports multiple AI providers for receipt parsing:

- **Groq** (Recommended)
- **LongCat**

**Development Mode**: If no API key is configured, the system uses mock data for testing.

See `temp.env` for all configuration options and required environment variables.

### OCR Configuration

- Set `ENABLE_OCR=true` to enable OCR processing
- Currently supports placeholder implementation
- Tesseract support can be added by installing `tesseract.js` package

### Product Matching

- Uses Levenshtein distance for name similarity
- Checks product name and aliases
- Confidence threshold: 70% (configurable)
- Unmatched items create PendingProduct entries

### Pending Products

- Created automatically for unmatched items
- Contains suggested fields from AI parsing
- Status: 'pending' → 'merged' or 'created' after approval
- Can be merged into existing products or used to create new ones

## Notes

- All monetary values are stored as numbers (not strings)
- Dates are stored in UTC, displayed in local timezone
- Stock quantities use base unit (kg, pcs, etc.)
- Customer balances can go negative (overpayment allowed)
- Purchase drafts require admin approval before creating final Purchase
- Pending products require resolution during draft approval
- WhatsApp share generates links but does NOT send messages automatically