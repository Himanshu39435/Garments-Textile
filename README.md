# NARANG TEXTILE: B2B Textile E-commerce

MERN-stack wholesale fabric platform: customer storefront, customer dashboard, admin panel, REST API, MongoDB.
Frontend and backend are fully separate: `frontend/` never imports from `backend/` and vice versa.

**Build status:** Phase 9 of 11 complete (B2B quotations and bulk ordering), plus role-based dashboards for admin, staff and customer. See [Roles and dashboards](#roles-and-dashboards) and [Progress](#progress).

## Folder structure

Folders that contain only `.gitkeep` are reserved for a later phase. They hold no code yet.

```
Narang-Textile/
  frontend/
    public/{images,banners,logo}
    src/
      components/{common,layout,product,cart,forms}
      pages/{home,products,auth,cart,customer,admin}   (+ dev/ for the design-system preview)
      services/api/      one API file per backend feature
      context/ hooks/ utils/ routes/ styles/
      App.jsx main.jsx
    tailwind.config.js postcss.config.js vite.config.js index.html
  backend/
    config/ models/ controllers/ routes/ middleware/ services/ utils/ validators/ scripts/
    server.js
  README.md
```

Files added beyond your list, because the tools require them: `frontend/index.html`, `tailwind.config.js`, `postcss.config.js`, `src/styles/antdTheme.js` (Ant Design theme), `src/pages/dev/DesignSystemPage.jsx` (dev-only preview, safe to delete).

## Setup

Requires Node 20+ and MongoDB (local or Atlas).

```bash
# Backend
cd backend
cp .env.example .env      # then fill in values
npm install
npm run dev               # http://localhost:5000

# Frontend (second terminal)
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173  (proxies /api to :5000)
```

Open http://localhost:5173/design-system to confirm the frontend renders and reaches the API.

## Environment variables

**backend/.env**: `NODE_ENV`, `PORT`, `CLIENT_URL`, `MONGODB_URI`, `JWT_SECRET` (use a long random value; also keys the OTP hashes), `JWT_EXPIRES_IN`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, `RAZORPAY_KEY_ID/KEY_SECRET`, `SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM`, `ADMIN_NAME/EMAIL/PASSWORD` (seed script only), optional `AUTH_RATE_LIMIT_MAX` and `OTP_RATE_LIMIT_MAX`.

**frontend/.env**: optional `VITE_WHATSAPP_NUMBER` in international digits without `+` or spaces (for example `919876543210`). The floating WhatsApp support button uses the placeholder phone number until this is configured.

Commerce rules (all optional; **defaults are placeholders, confirm them with your accountant**): `DEFAULT_GST_PERCENT` (5), `SHIPPING_FLAT_RATE` (500), `FREE_SHIPPING_THRESHOLD` (50000), `SELLER_STATE_CODE` (GST state code of your registration, decides CGST+SGST vs IGST), `BANK_ACCOUNT_NAME/ACCOUNT_NUMBER/IFSC/NAME` (shown for bank-transfer orders), `RAZORPAY_WEBHOOK_SECRET`.

Invoice seller details (printed on GST invoices; placeholders until set): `SELLER_NAME`, `SELLER_ADDRESS`, `SELLER_GSTIN`, `SELLER_PHONE`, `SELLER_EMAIL`. Optional `hsnCode` (4 to 8 digits) per product is printed on the invoice when present.

**Razorpay setup:** put the Key ID and Secret in `backend/.env` (test keys first). In the Razorpay dashboard add a webhook to `https://YOUR-API/api/payments/razorpay/webhook` for `payment.captured` (and `order.paid`) using the same secret as `RAZORPAY_WEBHOOK_SECRET`. The webhook confirms payments when a buyer closes the tab after paying.

Quote values containing `#` or spaces (`ADMIN_PASSWORD="My#Pass word"`), or dotenv cuts them short.

**Email setup:** OTP emails are always sent through SMTP; they are never printed to the backend console. Add valid SMTP credentials to `backend/.env` before testing registration or forgot-password locally. For Brevo, use `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, your Brevo SMTP login as `SMTP_USER`, the Brevo SMTP key (not the account password) as `SMTP_PASS` or `SMTP_PASSWORD`, and a verified sender as `EMAIL_FROM` or `SMTP_FROM`. `SMTP_SECURE` is optional and defaults according to the port (true for 465); set it to `false` for port 587. If SMTP is missing or invalid, the API returns an error instead of exposing an OTP in local logs. Non-OTP notification emails may still use the development console fallback.
**frontend/.env**: `VITE_API_BASE_URL` (default `/api`), `VITE_RAZORPAY_KEY_ID` (public key id only). Secrets never go in the frontend.

## API documentation

All responses use `{ success, message, data, meta? }`. Errors use `{ success:false, message, details }`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/health | none | API status and database connection state |
| GET | /api/products | none | Catalogue. Query: `search`, `category` (slug), `fabric` (csv), `color` (csv of names), `minPrice`, `maxPrice`, `flag` (`best`/`new`), `sort` (`newest`/`popular`/`price_asc`/`price_desc`/`name`), `page`, `limit` (max 48). Returns `meta: { page, limit, total, totalPages }`. Invalid values return 400. |
| GET | /api/products/filters | none | Fabric types, colours and price range for the filter sidebar. |
| GET | /api/products/:slug | none | One active product with `stockStatus` and up to 4 `related` products. 404 if missing or not active. |
| GET | /api/categories | none | Active categories with `productCount`. |
| GET | /api/categories/:slug | none | One category. |
| POST | /api/auth/register | none | `{ name, email, phone, password, companyName?, gstin? }`. Creates an unverified account and emails a 6-digit code. Never overwrites the password of a pending account. |
| POST | /api/auth/verify-otp | none | `{ email, otp }`. Verifies the email and returns `{ token, user }`. |
| POST | /api/auth/resend-otp | none | `{ email }`. Same answer whether or not the account exists. 60 s cooldown. |
| POST | /api/auth/login | none | `{ email, password }` -> `{ token, user }`. Unverified accounts get 403 with `code: EMAIL_NOT_VERIFIED` and a fresh code. |
| POST | /api/auth/forgot-password | none | `{ email }`. Always the same response, so emails cannot be probed. |
| POST | /api/auth/reset-password | none | `{ email, otp, newPassword }`. A correct code also verifies a pending account. |
| GET | /api/auth/me | customer/admin | Current user. |
| PUT | /api/auth/password | customer/admin | `{ currentPassword, newPassword }` -> fresh token. All older tokens stop working. |
| PUT | /api/customer/profile | customer/admin | Any of `name, phone, companyName, gstin, businessType`. Role cannot be changed here. |
| GET | /api/admin/session | admin only | Confirms admin access server-side. Every `/api/admin/*` route needs `protect`; AdminRoutes.js then sets admin only or admin + staff per feature (see [Roles and dashboards](#roles-and-dashboards)). |
| GET | /api/staff/session | staff only | Confirms staff access server-side. |
| GET | /api/staff/dashboard | staff only | `{ staff, attention, orderQueue, quoteQueue, lowStockProducts, myMonth }`. A work queue with no revenue figures. |
| GET/POST | /api/admin/staff | admin only | List staff (with actions in the last 30 days) / create `{ name, email, phone, designation?, password }`. |
| PUT | /api/admin/staff/:id | admin only | `{ name?, phone?, designation? }`. Email and role cannot change. |
| PUT | /api/admin/staff/:id/status | admin only | `{ isActive }`. A deactivated staff member is locked out on their next request. |
| PUT | /api/admin/staff/:id/password | admin only | `{ newPassword }`. Signs the person out everywhere. |
| GET | /api/admin/dashboard | admin only | Totals, this-month vs last-month, "needs attention" counts, orders by status, 12 months of sales, top products, sales by category, recent orders, low-stock list. |
| GET | /api/cart | customer | Priced cart `{ items, itemCount, hasIssues, totals }`. Optional `?addressId=` adds the CGST/SGST vs IGST split. |
| POST | /api/cart/items | customer | `{ productId, quantity }` (whole metres). Adds to the existing quantity. MOQ and stock enforced. Prices are never accepted from the client. |
| PUT | /api/cart/items/:productId | customer | `{ quantity }` sets the quantity. |
| DELETE | /api/cart/items/:productId, /api/cart | customer | Remove one item / clear the cart. |
| GET/POST | /api/customer/addresses | customer | List / create (max 10). First address becomes the default. |
| PUT/DELETE | /api/customer/addresses/:id | customer | Update / delete. Deleting the default promotes another. |
| POST | /api/orders | customer | `{ shippingAddressId, billingAddressId?, paymentMethod: razorpay or bank_transfer, notes? }`. Recomputes everything from the cart, reserves stock atomically, creates the order, empties the cart. |
| GET | /api/orders, /api/orders/:id | customer | Own orders only. List supports `?status=`, `page`, `limit`. A single order includes `statusHistory`, `shipment` and (bank transfer) bank details. |
| GET | /api/orders/:id/invoice | customer | GST tax invoice PDF. Only for paid orders. Invoice numbers are `NT/<financial-year>/<6 digits>`, assigned when payment is confirmed. |
| GET | /api/customer/dashboard | customer only | `{ totalOrders, openOrders, awaitingPayment, totalSpent, wishlistCount, recentOrders, quotations: { total, awaitingReply, readyToOrder, recent } }`. |
| GET | /api/customer/wishlist | customer | `{ ids, products }` (active products only, newest saved first). |
| POST/DELETE | /api/customer/wishlist/:productId | customer | Save (idempotent) / remove. Returns `{ ids }`. |
| POST | /api/orders/:id/cancel | customer | Cancels an unpaid pending order and returns its stock. |
| POST | /api/payments/razorpay/order | customer | `{ orderId }`. Creates or reuses the Razorpay order. Also used to retry an unpaid order. |
| POST | /api/payments/razorpay/verify | customer | Checks Razorpay's signature on the server, then marks the order paid and confirmed. |
| POST | /api/payments/razorpay/webhook | Razorpay signature | Raw-body signature check, then marks the order paid. Idempotent. |
| POST | /api/admin/uploads/image | admin only | Multipart field `image` (JPG, PNG or WebP, max 5 MB, content checked). Returns `{ url, publicId }`. |
| GET | /api/admin/products | admin + staff | List (all statuses; `search`, `status`, `category`, `lowStock`, `page`, `limit`). |
| POST | /api/admin/products | admin only | Create. |
| GET | /api/admin/products/:id | admin + staff | Read. |
| PUT/DELETE | /api/admin/products/:id | admin only | Update / delete. Delete archives instead when the product is in any order. |
| GET/POST | /api/admin/categories | admin only | List including hidden, with product counts / create. |
| PUT/DELETE | /api/admin/categories/:id | admin only | Update / delete (refused while products use it). |
| GET | /api/admin/orders, /api/admin/orders/:id | admin + staff | List (`status`, `paymentStatus`, `paymentMethod`, `search`, `from`, `to`, `page`) / full order with payments and `allowedStatuses`. |
| PUT | /api/admin/orders/:id/status | admin + staff | `{ status, note?, courier?, trackingNumber?, trackingUrl? }`. Courier required when shipping. Cancelling returns stock and is admin only (403 for staff). |
| PUT | /api/admin/orders/:id/shipment | admin + staff | Correct courier details after shipping. |
| POST | /api/admin/orders/:id/mark-paid | admin only | `{ reference? }`. Confirms a bank transfer, assigns the invoice number, emails the customer. |
| POST | /api/admin/orders/:id/mark-refunded | admin only | `{ reference? }`. Records a refund you already paid out for a cancelled paid order. |
| GET | /api/admin/orders/:id/invoice | admin + staff | Invoice PDF for a paid order. |
| GET | /api/admin/customers, /api/admin/customers/:id | admin + staff | List (search name, email, phone, company, GSTIN) with order count and total paid / profile, addresses, order history. |
| PUT | /api/admin/customers/:id/status | admin only | `{ isActive }`. A deactivated customer is locked out on their next request. |
| POST | /api/quotations | customer | `{ items: [{ productId, quantity, requestedPrice? }], notes?, requiredBy? }`. Each quantity must meet the product's minimum order. Duplicate products are merged. |
| GET | /api/quotations, /api/quotations/:id | customer | Own quotations (`?status=` requested, approved, expired, converted, rejected, cancelled). One quote adds `?addressId=` for the CGST/SGST vs IGST split. Only approved or converted quotes carry prices. |
| POST | /api/quotations/:id/cancel | customer | Withdraw a request or decline an approved quote. |
| POST | /api/quotations/:id/convert | customer | Same body as checkout (`shippingAddressId`, `billingAddressId?`, `paymentMethod`, `notes?`). Places the order at the quoted prices. |
| GET | /api/admin/quotations, /api/admin/quotations/:id | admin + staff | List (`status`, `search`, `page`) / one quote with the customer's details and linked order. |
| PUT | /api/admin/quotations/:id/approve | admin + staff | `{ items: [{ productId, quantity, quotedPrice }], discountPercent?, shippingCharge?, validUntil, adminNote? }`. Also re-prices an approved or expired quote. Emails the customer. |
| PUT | /api/admin/quotations/:id/reject | admin + staff | `{ reason? }`. Emails the customer. |
| POST | /api/admin/quotations/:id/convert | admin + staff | Creates a bank-transfer order for the customer at the quoted prices, using their default address. |
| POST | /api/newsletter/subscribe | none | Body `{ email }`. Validates, then upserts the subscriber. Idempotent. |

Endpoints are added per phase.

## Database setup

Set `MONGODB_URI`, then load sample catalogue data:

```bash
cd backend
npm run seed:products   # Replaces the sample catalogue with 8 garment categories and 22 wholesale products.
```

Sample prices, stock and specs are illustrative.

Create the admin account (set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` first; there is no default password):

```bash
npm run seed:admin
```

## Deployment (outline; finalised in Phase 11)

- Backend: any Node host. Set `NODE_ENV=production` and all backend env vars. In production the server exits if MongoDB is unreachable.
- Frontend: `npm run build` in `frontend/`, serve `dist/` from a static host. Set `VITE_API_BASE_URL` to the public API URL (and `CLIENT_URL` on the backend for CORS).

## Feature-to-file mapping

| I want to change... | Edit |
|---|---|
| Brand colours, fonts, breakpoints | `frontend/tailwind.config.js`, `frontend/src/styles/global.css` |
| Ant Design component theme | `frontend/src/styles/antdTheme.js` |
| Currency / date display | `frontend/src/utils/formatCurrency.js`, `formatDate.js` |
| Shared constants (categories, statuses, GST default) | `frontend/src/utils/constants.js` |
| How the frontend calls the API (token, errors) | `frontend/src/services/api/apiClient.js` |
| Loading / error UI | `components/common/LoadingSpinner.jsx`, `ErrorMessage.jsx` |
| Route table | `frontend/src/routes/AppRoutes.jsx` |
| Database connection | `backend/config/databaseConfig.js` |
| Cloudinary / Razorpay clients | `backend/config/cloudinaryConfig.js`, `razorpayConfig.js` |
| Error responses, 404s | `backend/middleware/ErrorMiddleware.js` |
| Response / error format | `backend/utils/ApiResponse.js`, `ApiError.js` |
| JWT creation | `backend/utils/GenerateToken.js` |
| Header, mega menu, mobile menu | `components/common/Header.jsx`, `MegaMenu.jsx`, `MobileNavDrawer.jsx` |
| Footer | `components/common/Footer.jsx` |
| Header search box | `components/common/SearchBar.jsx` |
| Page shell (header + content + footer) | `components/layout/MainLayout.jsx` |
| Fabric categories (names, descriptions, textures) | `utils/constants.js` -> `FABRIC_CATEGORY_DETAILS` |
| Phone, email, address, GSTIN | `utils/constants.js` -> `CONTACT` |
| Generated fabric sample look (until photos exist) | `components/common/FabricSwatch.jsx` |
| Home page section order | `pages/home/HomePage.jsx` |
| Hero / stats / categories / showcase / why us / bulk slabs / testimonials / FAQ / newsletter | `pages/home/sections/<Name>.jsx` |
| Home page copy: stats, FAQ, testimonials, slabs | `pages/home/homeContent.js` |
| About / Contact / 404 pages | `pages/home/AboutPage.jsx`, `ContactPage.jsx`, `NotFoundPage.jsx` |
| Newsletter form / API / storage | `sections/NewsletterSection.jsx` / `services/api/newsletterApi.js` + `backend/controllers/NewsletterController.js` + `routes/NewsletterRoutes.js` + `validators/NewsletterValidator.js` / `backend/models/NewsletterSubscriberModel.js` |
| Request validation (generic wrapper) | `backend/middleware/ValidationMiddleware.js` |
| Register / login forms | `components/forms/RegisterForm.jsx`, `LoginForm.jsx` |
| Login / register / OTP / forgot-password pages | `pages/auth/LoginPage.jsx`, `RegisterPage.jsx`, `VerifyOTPPage.jsx`, `ForgotPasswordPage.jsx` |
| Auth page look (two-panel shell) | `components/layout/AuthLayout.jsx` |
| Signed-in state, login/logout | `context/AuthContext.jsx`, `hooks/useAuth.js` |
| Blocking pages for signed-out users or by role | `components/common/ProtectedRoute.jsx` |
| Form validation rules (frontend) | `utils/validateForm.js` (mirrors `backend/validators/AuthValidator.js`) |
| Auth / profile API calls | `services/api/authApi.js`, `customerApi.js` |
| Customer profile page, customer area routes | `pages/customer/CustomerProfile.jsx`, `routes/CustomerRoutes.jsx` |
| Account menu in the header | `components/common/Header.jsx`, `MobileNavDrawer.jsx` |
| User fields, password hashing | `backend/models/UserModel.js` |
| Register / login / OTP / reset logic | `backend/controllers/AuthController.js`, `routes/AuthRoutes.js` |
| OTP generation, expiry, attempts, cooldown | `backend/services/OTPService.js` |
| Sending email (SMTP / dev console) | `backend/services/EmailService.js` |
| JWT check, admin check, rate limits | `backend/middleware/AuthMiddleware.js`, `AdminMiddleware.js`, `RateLimitMiddleware.js` |
| Password / phone / GSTIN rules (server) | `backend/validators/AuthValidator.js`, `CustomerValidator.js` |
| Customer profile API | `backend/controllers/CustomerController.js`, `routes/CustomerRoutes.js` |
| Admin session API | `backend/controllers/AdminController.js`, `routes/AdminRoutes.js` |
| Create the admin user | `backend/scripts/SeedAdmin.js` |
| Add to cart button, quantity calculator | `components/product/BulkPriceCalculator.jsx` |
| Cart state and actions | `context/CartContext.jsx`, `hooks/useCart.js`, `services/api/cartApi.js` |
| Cart page, cart line, quantity stepper, totals box | `pages/cart/CartPage.jsx`, `components/cart/CartItem.jsx`, `QuantitySelector.jsx`, `CartSummary.jsx` |
| Checkout page | `pages/cart/CheckoutPage.jsx` |
| Order confirmation, pay-now, bank details, cancel | `pages/cart/OrderSuccessPage.jsx` |
| Address form / states list | `components/forms/AddressForm.jsx`, `utils/indianStates.js` (mirrors `backend/config/indianStates.js`) |
| Razorpay popup | `utils/razorpayCheckout.js`, `services/api/paymentApi.js` |
| Cart badge in header | `components/common/Header.jsx` |
| Price, slab, GST, shipping, tax-split rules (server, the authority) | `backend/services/PricingService.js` |
| GST rate, shipping, seller state, bank details | `backend/config/commerceConfig.js` (values from `.env`) |
| Cart loading / serialising | `backend/services/CartService.js`, `controllers/CartController.js`, `routes/CartRoutes.js`, `models/CartModel.js` |
| Placing / cancelling orders, stock reservation, marking paid | `backend/services/OrderService.js`, `controllers/OrderController.js`, `routes/OrderRoutes.js`, `models/OrderModel.js` |
| Order number sequence | `backend/models/CounterModel.js` |
| Razorpay order creation, signature checks | `backend/services/PaymentService.js`, `config/razorpayConfig.js` |
| Payment endpoints, webhook | `backend/controllers/PaymentController.js`, `routes/PaymentRoutes.js`, `models/PaymentModel.js` |
| Address book API | `backend/controllers/AddressController.js`, `routes/AddressRoutes.js`, `models/AddressModel.js`, `validators/AddressValidator.js` |
| Cart / checkout request rules | `backend/validators/CartValidator.js`, `OrderValidator.js` |
| Account shell and side navigation | `components/layout/CustomerLayout.jsx`, `routes/CustomerRoutes.jsx` |
| Dashboard home | `pages/customer/CustomerDashboard.jsx` (API: `backend/controllers/CustomerController.js` -> `getDashboardSummary`) |
| Order history list and filters | `pages/customer/CustomerOrders.jsx` |
| Single order page (tracking, pay, cancel, invoice) | `pages/customer/CustomerOrderDetails.jsx` |
| Tracking timeline | `components/order/OrderStatusTimeline.jsx` |
| Status badges | `components/order/OrderStatusTag.jsx` |
| Items, totals, addresses block | `components/order/OrderSummaryView.jsx` |
| Bank transfer details block | `components/order/BankTransferDetails.jsx` |
| Pay now / cancel / invoice download behaviour | `hooks/useOrderActions.js`, `utils/downloadFile.js` |
| My addresses page | `pages/customer/CustomerAddresses.jsx` (form: `components/forms/AddressForm.jsx`) |
| Wishlist page, heart button, saved ids | `pages/customer/CustomerWishlist.jsx`, `components/product/WishlistButton.jsx`, `context/WishlistContext.jsx`, `hooks/useWishlist.js` |
| Invoice PDF layout | `backend/services/InvoiceService.js` |
| Invoice numbering (per financial year) | `backend/utils/GenerateInvoiceNumber.js` |
| Order status history, shipment fields, invoice fields | `backend/models/OrderModel.js` |
| Product list, add, edit pages | `pages/admin/AdminProductManagement.jsx`, `AdminAddProduct.jsx`, `AdminEditProduct.jsx` |
| Product form fields and layout | `components/forms/ProductForm.jsx` |
| Image upload control | `components/forms/ImageUploader.jsx` (API: `backend/controllers/AdminController.js` -> `uploadImage`) |
| Category management page | `pages/admin/AdminCategoryManagement.jsx` |
| Orders list / one order (status, shipping, payment, refund, invoice) | `pages/admin/AdminOrderManagement.jsx`, `AdminOrderDetails.jsx` |
| Customers list / one customer (company, GST, history, deactivate) | `pages/admin/AdminCustomerManagement.jsx`, `AdminCustomerDetails.jsx` |
| Admin API calls | `services/api/adminApi.js` |
| Categories shown in menu, footer, home (from the API) | `context/CategoryContext.jsx`, `hooks/useCategoryList.js`, `components/common/CategoryVisual.jsx` |
| Product rules (price, slabs, MOQ, SKU, images) | `backend/validators/ProductValidator.js` -> `validateProductInput` |
| Product admin logic (create, update, delete or archive) | `backend/controllers/AdminProductController.js`, `routes/AdminProductRoutes.js` |
| Category admin logic / rules | `backend/controllers/AdminCategoryController.js`, `routes/AdminCategoryRoutes.js`, `validators/CategoryValidator.js` |
| Order admin logic (list, status, shipping, mark paid, refund) | `backend/controllers/AdminOrderController.js`, `routes/AdminOrderRoutes.js` |
| Allowed status changes, bank-transfer confirmation, refund records | `backend/services/OrderService.js` (`STATUS_TRANSITIONS`, `changeOrderStatus`, `confirmBankTransfer`, `recordRefund`) |
| Order status rules for admin input | `backend/validators/OrderValidator.js` |
| Customer admin logic | `backend/controllers/AdminCustomerController.js`, `routes/AdminCustomerRoutes.js` |
| Image storage (Cloudinary or dev folder), upload checks | `backend/services/CloudinaryService.js`, `middleware/UploadMiddleware.js`, `config/cloudinaryConfig.js` |
| Customer emails on order updates | `backend/services/EmailService.js` (`sendOrderUpdateEmail`) |
| Where every back-office route is guarded (admin only vs admin + staff) | `backend/routes/AdminRoutes.js`, plus the `requireAdmin` calls inside `AdminOrderRoutes.js`, `AdminProductRoutes.js`, `AdminCustomerRoutes.js` |
| Who may do what (role checks) | `backend/middleware/RoleMiddleware.js` (`requireAdmin`, `requireStaff`, `requireStaffOrAdmin`, `requireCustomer`) |
| Staff accounts (create, edit, deactivate, reset password) | `backend/controllers/AdminStaffController.js`, `routes/AdminStaffRoutes.js`, `validators/StaffValidator.js`, `frontend/src/pages/admin/AdminStaffManagement.jsx` |
| Staff dashboard numbers and queues | `backend/services/StaffDashboardService.js`, `controllers/StaffController.js`, `routes/StaffRoutes.js` |
| Staff dashboard screen | `frontend/src/pages/staff/StaffDashboard.jsx` (API: `services/api/staffApi.js`) |
| Staff stock list (read only) | `frontend/src/pages/staff/StaffStockOverview.jsx` |
| Staff shell and nav | `components/layout/StaffLayout.jsx` (shared frame: `PanelShell.jsx`), routes in `routes/StaffRoutes.jsx` |
| Which dashboard each role lands on, role names | `frontend/src/utils/constants.js` (`ROLES`, `ROLE_HOME`, `roleHome`), `components/common/ProtectedRoute.jsx` |
| Admin/staff shared pages staying inside /admin or /staff | `frontend/src/hooks/usePanelPaths.js` |
| Create a test staff login | `backend/scripts/SeedStaff.js` (`npm run seed:staff`) |
| Quote request form (fabric picker, quantities, target price) | `components/forms/QuoteRequestForm.jsx`, `pages/customer/CustomerNewQuotation.jsx` (route `/quote`) |
| My quotations list / one quotation (accept, decline) | `pages/customer/CustomerQuotations.jsx`, `CustomerQuotationDetails.jsx` |
| Ordering from a quotation | `pages/cart/QuoteCheckoutPage.jsx` |
| Address, payment and notes block shared by both checkouts | `components/cart/CheckoutDetails.jsx`, `hooks/useCheckoutDetails.js`, `hooks/useCompleteOrder.js` |
| Quote lines and totals display, status badges | `components/quotation/QuotationSummaryView.jsx`, `QuotationStatusTag.jsx` |
| Admin quotation list / pricing screen | `pages/admin/AdminQuotationManagement.jsx`, `AdminQuotationDetails.jsx` |
| Live price preview in the admin form | `utils/quotePricing.js` (the server's figures are the ones charged) |
| Quote API calls | `services/api/quotationApi.js`, `services/api/adminApi.js` |
| Quote lifecycle (request, approve, reject, cancel, convert, expiry) | `backend/services/QuotationService.js` |
| Quote pricing (discount folded into rates, GST, shipping) | `backend/services/PricingService.js` -> `priceQuotation` |
| Shared order creation (cart and quotes) | `backend/services/OrderService.js` -> `createOrderFromLines` |
| Quote fields | `backend/models/QuotationModel.js` |
| Quote request and approval rules | `backend/validators/QuotationValidator.js` |
| Customer / admin quote endpoints | `backend/controllers/QuotationController.js`, `AdminQuotationController.js`, `routes/QuotationRoutes.js`, `AdminQuotationRoutes.js` |
| Admin shell (side nav, top bar, sign out) | `components/layout/AdminLayout.jsx` (shared frame: `components/layout/PanelShell.jsx`) |
| Admin routes (add new admin pages here and in the layout nav) | `routes/AdminRoutes.jsx` |
| Admin dashboard page | `pages/admin/AdminDashboard.jsx` |
| KPI tile, monthly sales chart, category chart | `components/admin/StatCard.jsx`, `MonthlySalesChart.jsx`, `CategorySalesChart.jsx` |
| Admin API calls | `services/api/adminApi.js` |
| Short money formats for charts and headlines | `utils/formatCurrency.js` (`formatCompactCurrency`, `formatCurrencyWhole`) |
| Order / payment status badges (shared) | `components/order/OrderStatusTag.jsx` (`OrderTags`) |
| Dashboard numbers (what counts as revenue, months, low stock) | `backend/services/DashboardService.js` |
| Dashboard endpoint | `backend/controllers/AdminController.js`, `routes/AdminRoutes.js` |
| Who counts as admin | `backend/middleware/AdminMiddleware.js` (role in the database, set by `npm run seed:admin`) |
| Product card design | `components/product/ProductCard.jsx` |
| Product grid, loading skeletons, empty state | `components/product/ProductGrid.jsx` |
| Catalogue page (search, filters, sort, pagination) | `pages/products/ProductListingPage.jsx` |
| Category page | `pages/products/CategoryPage.jsx` (reuses the listing page) |
| Filter sidebar controls | `components/product/ProductFilters.jsx` |
| Quick view popup | `components/product/ProductQuickView.jsx` |
| Product detail page | `pages/products/ProductDetailsPage.jsx` |
| Image gallery and zoom | `components/product/ProductGallery.jsx` |
| Bulk price table / quantity calculator | `components/product/BulkPricingTable.jsx`, `BulkPriceCalculator.jsx` |
| Price display (per metre, MOQ) | `components/product/ProductPrice.jsx` |
| Slab pricing, MOQ and GST maths (frontend) | `utils/pricing.js` |
| Page switcher | `components/common/Pagination.jsx` |
| Fetching products / categories | `hooks/useProducts.js`, `services/api/productApi.js`, `categoryApi.js` |
| Product API behaviour (search, filters, sort) | `backend/controllers/ProductController.js`, `routes/ProductRoutes.js` |
| Product query rules (allowed sorts, limits) | `backend/validators/ProductValidator.js` |
| Product database fields, stock status | `backend/models/ProductModel.js` |
| Category database fields / API | `backend/models/CategoryModel.js` / `controllers/CategoryController.js` + `routes/CategoryRoutes.js` |
| Sample catalogue data | `backend/scripts/SeedProducts.js` |
| Admin product management (Phase 8) | `pages/admin/AdminProductManagement.jsx` |

This table grows with every phase.

## Progress

- [x] Phase 1: Structure and design system
- [x] Phase 2: Homepage and navigation
- [x] Phase 3: Catalogue and product details
- [x] Phase 4: Authentication
- [x] Phase 5: Cart and checkout
- [x] Phase 6: Customer dashboard
- [x] Phase 7: Admin dashboard
- [x] Phase 8: Product, category, customer and order management
- [x] Phase 9: Quotations and bulk ordering
- [x] Role-based dashboards: admin, staff, customer (added after Phase 9)
- [ ] Phase 10: Inventory and reports
- [ ] Phase 11: Testing and deployment

## Placeholder content to replace before launch

- `utils/constants.js` -> `CONTACT` (phone, email, address, hours, GSTIN).
- `pages/home/homeContent.js`: business statistics, testimonials, FAQ answers and bulk slab percentages are illustrative, not real company facts.
- `backend/scripts/SeedProducts.js`: replaces the sample catalogue with PNT, Kurti, Kurti Set, Co-ord Set and Frock products. It clears existing sample products/categories before seeding; update prices, stock and details through the admin panel.
- Fabric textures are generated in CSS by `FabricSwatch.jsx`. Real photography goes in `ProductCard` via `product.image`.
- `AboutPage.jsx` story copy.

## Known gaps after Phase 2

- Header links to `/quote` and `/account/wishlist` show the 404 page until Phases 9 and 6 add them.
- Product write APIs (create, edit, delete, image upload) arrive with the admin panel in Phase 8, behind admin authorization.
- Catalogue search is a case-insensitive match on name, SKU, composition, fabric type and tags. If the catalogue grows past a few thousand products, switch to a MongoDB text or Atlas Search index.
- Shipment details (courier, tracking number, shipped and delivered dates) and the processing/shipped/delivered statuses are set by the admin in Phase 8. Until then the tracking timeline shows placed and paid steps only.
- The admin panel has Dashboard, Products, Categories, Orders and Customers. Inventory, reports and settings (Phase 10) are added the same way: a nav entry in `AdminLayout.jsx` and a route in `AdminRoutes.jsx`.
- Stock is edited directly on the product. A stock history (stock in, stock out, who and why) arrives in Phase 10.
- Razorpay refunds are not automated: refund in the Razorpay dashboard (or by bank), then use "Record refund" on the order.
- Image uploads to Cloudinary could not be tested live while building (no network access to Cloudinary). Test one upload with your keys before launch.
- The Contact page has no enquiry form. Buyers who want special pricing use the quote request form at `/quote`.
- Backend was tested against FerretDB (a MongoDB-compatible server), not MongoDB itself, because MongoDB is not installable in the build sandbox. Run `npm run seed:products` and open `/products` against your real MongoDB to confirm.

## Authentication notes

- **Token storage:** the JWT is kept in `localStorage` and sent as a Bearer header. This is simple and works across the separate frontend and API origins, but any cross-site-scripting bug could read it. Keep dependencies updated and avoid rendering unsanitised HTML. Moving to an httpOnly cookie is a possible later hardening step.
- **No server-side logout list:** logging out clears the token in the browser. A stolen token stays valid until it expires (`JWT_EXPIRES_IN`, default 7 days) or the user changes their password, which invalidates all older tokens.
- **OTP rules:** 6 digits, valid 10 minutes, 5 wrong attempts then the code is locked, 60 s between sends, stored only as an HMAC hash.
- **Rate limits:** 60 requests and 10 email-sending requests per IP per 15 minutes by default. Behind a proxy or load balancer in production the server trusts the first proxy hop for client IPs.
- **Not included:** changing the account email, social login, two-factor authentication and an admin UI to deactivate users (the `isActive` flag is enforced when set).

## Cart, checkout and payment notes

- **The server is the only authority on money.** The browser sends product ids, whole-metre quantities, address ids and a payment method. It cannot send a price. Totals are recomputed on every cart read and again when the order is placed.
- **Carts need an account.** Guests are sent to sign in when they press Add to cart, then returned to the product. There are no anonymous carts to merge.
- **Stock** is reserved with an atomic conditional decrement when the order is placed, and given back if any line fails or if the customer cancels an unpaid order. There is no transaction support requirement.
- **Unpaid online orders keep stock reserved** until the customer pays or cancels. There is no automatic expiry yet: add a scheduled job to cancel old unpaid orders before high traffic.
- **Tax:** GST uses each product's `gstPercent` (default `DEFAULT_GST_PERCENT`). Delivery in the seller's state gives CGST + SGST, anywhere else gives IGST. **Shipping is not taxed in these totals.** Confirm the correct GST treatment of shipping charges with your accountant.
- **Payment confirmation** happens only through a verified signature (browser) or a verified webhook. A payment that arrives for a cancelled order is logged for manual refund.
- **Not yet built:** refunds, partial payments, stock history log (Phase 10) and admin order management (Phase 8).

## Invoices

- A GST tax invoice is available for **paid** orders from the order page (PDF, `GET /api/orders/:id/invoice`). Bank-transfer orders get one after the admin marks them paid (Phase 8).
- Numbers are sequential per Indian financial year (April to March) and are assigned once, when payment is confirmed, so they do not change on re-download. Cancelled or unpaid orders never consume a number.
- Amounts print as "Rs" because the PDF's built-in fonts have no rupee symbol. Embed a font such as Noto Sans in `InvoiceService.js` if you want the symbol.
- Check with your accountant that the layout carries everything required for your turnover: HSN codes (fill `hsnCode` on products), amount in words, reverse-charge and signature lines are **not** included yet. Shipping is shown without separate tax.

## Roles and dashboards

Three roles, three dashboards. The role is stored on the user in the database, and the API checks it on every request, so changing the browser cannot grant access.

| Role | Signs in at | Lands on | Dashboard shows |
|---|---|---|---|
| customer | `/login` | `/account` | Their own orders, quotations (awaiting reply, ready to order), wishlist, addresses, profile |
| staff | `/login` | `/staff` | A work queue: paid orders to start, orders being prepared, quote requests, low stock, what they handled this month. No revenue or sales figures |
| admin | `/login` | `/admin` | Revenue, orders, customers, products, staff count, monthly sales, top products, low stock, everything needing attention |

A person who opens another role's area (for example a customer visiting `/admin`) is sent to their own dashboard. Header menus show the link that matches the role.

**What staff can and cannot do**

| Area | Admin | Staff |
|---|---|---|
| Orders | Everything | View, start processing, mark shipped or delivered, edit shipping details, download invoices |
| Order payments, refunds, cancelling | Yes | No. The screens say an admin does this |
| Quotations | Everything | View, approve with prices, reject, convert to an order |
| Customers | View, deactivate, reactivate | View only |
| Products | Add, edit, delete, upload images | View stock only (`/staff/stock`) |
| Categories, staff accounts, image uploads | Yes | No |

**Adding staff:** sign in as admin, open Staff, choose "Add staff member", and share the first password with them. You can also deactivate, reactivate and reset passwords there. For a quick test login: set `STAFF_EMAIL` and `STAFF_PASSWORD` in `backend/.env`, then run `npm run seed:staff`.

**Changing who can do what:** the rules live in `backend/routes/AdminRoutes.js` (per feature) and in the `requireAdmin` calls inside `AdminOrderRoutes.js`, `AdminProductRoutes.js` and `AdminCustomerRoutes.js` (per action). To let staff do more, remove `requireAdmin` from that route. Hide the matching button in the page too (pages read `isAdmin` from `hooks/usePanelPaths.js`). Admin and staff share the order, quotation and customer pages, so a page change shows up in both panels.

## Admin dashboard notes

- **Access:** `/admin` is for users whose role is `admin` in the database. Create one with `npm run seed:admin`. The browser hides the page from others, and every `/api/admin/*` call is checked again on the server, so editing the browser cannot grant access. Admins sign in at the normal `/login` page and land on `/admin`. Admins also see an "Admin panel" entry in the account menu.
- **Revenue** means money collected: paid, non-cancelled orders including GST and shipping. "Sales by category" and "Top products" use item value before GST and shipping.
- **Months** are calendar months in Indian time (IST), so a sale at 1 am on the 1st lands in the right month. The chart covers the last 12 months, with empty months shown as zero.
- **Month-over-month change** compares this month so far with all of last month, so it will look low early in the month. The card says so.
- **Performance:** the 12-month breakdowns are computed in memory from paid orders, which is fine for a few thousand orders a year. For much larger volumes, move them to database aggregation or cached reports (Phase 10).
- **Charts** are in their own bundle, loaded only on admin pages, and have a "View as table" alternative for screen readers.

## Admin management notes

- **Images:** with `CLOUDINARY_*` set, uploads go to Cloudinary. Without them, in development only, files are saved under `backend/uploads` and served at `/uploads` (set `API_PUBLIC_URL` if the API is not at `http://localhost:PORT`). In production without Cloudinary the upload endpoint refuses with a clear message. Files are checked by content, not just by the browser's reported type. An image uploaded in the form but never saved on a product stays in storage (a known, minor leak).
- **Deleting a product** removes it (and its images, wishlist and cart entries) only if it was never ordered. If it appears in any order it is archived instead, so order history keeps working. Archived and draft products are hidden from the store.
- **Product rules enforced on the server:** SKU 3 to 30 characters and unique, whole-metre MOQ and stock, bulk slab quantities strictly above the MOQ and increasing, slab prices strictly decreasing and below the base price, hex colours, at most 8 images. Unknown fields (for example `salesCount`) are ignored.
- **Order workflow:** Pending, then (after payment) Confirmed, Processing, Shipped, Delivered. Cancelling is possible before shipping and returns the stock. A bank-transfer order is confirmed with "Mark as received" (optionally with the bank reference), which also assigns the invoice number. Each change is recorded in the order history with the admin who made it (customers never see admin ids) and emails the customer (printed to the console when SMTP is not set).
- **Categories** are read from the API by the store menu, footer and home page, so renames, new categories and hidden ones show up immediately. The six fabric types used by the "Fabric" filter are fixed in code (`FABRIC_TYPES` in `ProductModel.js`).
- **Customers:** deactivating a customer locks them out on their next request and blocks login; their orders are kept. Admin accounts never appear in the customer screens.

## Quotations (B2B bulk pricing)

**Flow:** a signed-in buyer requests a quote (fabrics, quantities, optional target price, notes, needed-by date). An admin sets a per-metre price for each line, an optional discount on all lines, a shipping charge and a validity date, then approves it. The customer gets an email and sees the prices in their account. They place the order from the quotation (normal payment: Razorpay or bank transfer), or an admin creates a bank-transfer order for a customer who agreed by phone. A request can also be rejected by the admin or withdrawn by the customer.

- **Statuses:** requested, approved, converted, rejected, cancelled. A quote that is approved but past its validity date is shown as **expired** (computed, not stored). Validity runs to the end of that day in India. An admin can re-price and re-send an approved or expired quote.
- **Prices:** the discount is folded into every per-metre rate (rounded to paise), so the order and the invoice show the rate the customer actually pays. GST uses each product's rate on the discounted value, and CGST+SGST versus IGST follows the delivery state, as in normal checkout. If no shipping charge is entered the standard shipping rule is applied once and fixed on the quote.
- **Locked at approval:** prices do not move after approval, but stock is **not** reserved until the order is placed. If stock has run out or the product was archived, ordering fails with a clear message and the quote stays approved.
- **One quote, one order:** converting claims the quote with a single conditional update, so two clicks (or a customer and an admin at once) produce exactly one order. If order creation fails the claim is undone.
- **Quantities:** customers must request at least each product's minimum order. An admin may set a lower quantity on the quote (the agreed quantity is what gets ordered).
- **Custom fabrics or prints:** quote lines must be catalogue products. Describe custom requirements in the notes; create a product in the admin panel once agreed.
- **Credit terms:** not supported. Every quote order is paid by Razorpay or bank transfer.
- **Not built:** a printable quotation PDF, negotiation back-and-forth messaging, and per-line discounts (use the per-line price instead).
- **Notifications:** customers are emailed when a request is received, a quote is ready, a request is rejected, or an admin places their order. Without SMTP these print to the server console in development. Admins see new requests in the dashboard's "Quote requests to review" card.
