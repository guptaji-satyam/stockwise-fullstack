/**
 * StockWise Automated Integration & Verification Test Suite
 * Tests all key REST API flows:
 * 1. Health check
 * 2. User Authentication & JWT generation
 * 3. Role-Based Access Control (RBAC) restrictions
 * 4. Product CRUD & Category validation
 * 5. Customer CRUD
 * 6. Order Creation & Atomic Stock Deduction
 * 7. Stock Overflow Prevention (request > stock)
 * 8. Order Cancellation & Exact-Once Stock Restoration
 * 9. Real-time Dashboard Aggregations
 * 10. Reports & Analytics
 */

const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const { connectDB, closeDB } = require('../config/db');
const app = require('../server');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const InventoryTransaction = require('../models/InventoryTransaction');

let server;
let baseUrl;

// Helper to make HTTP requests
const request = ({ method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title}`);
      failed++;
    }
  };

  console.log('\n============================================================');
  console.log(' Starting StockWise Integration Test Suite');
  console.log('============================================================\n');

  try {
    await connectDB();

    // Start server on an ephemeral port
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`[Test Runner] Test server listening on ${baseUrl}\n`);
        resolve();
      });
    });

    // Clean test DB
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await InventoryTransaction.deleteMany({});

    // 1. Health Check
    console.log('[Phase 1] Server Health Check');
    const health = await request({ method: 'GET', path: '/api/health' });
    assert(health.status === 200 && health.body.status === 'healthy', 'GET /api/health returns 200 Healthy');

    // 2. Authentication & RBAC
    console.log('\n[Phase 2] Authentication & User Registration');

    // Register Staff
    const regRes = await request({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Sarah Staff',
        email: 'sarah.staff@test.com',
        password: 'Password@123',
        phone: '1234567890',
      },
    });
    assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created');
    assert(regRes.body.data.role === 'staff', 'Public registration assigns staff role automatically');
    const staffToken = regRes.body.data.token;

    // Create Admin directly in database (as secure seed would)
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@test.com',
      password: 'AdminPassword@123',
      role: 'admin',
    });

    // Login Admin
    const loginRes = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: 'admin@test.com',
        password: 'AdminPassword@123',
      },
    });
    assert(loginRes.status === 200, 'POST /api/auth/login returns 200 for valid credentials');
    assert(loginRes.body.data.role === 'admin', 'Login returns correct admin role and JWT');
    const adminToken = loginRes.body.data.token;

    // Verify GET /api/auth/me
    const meRes = await request({
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(meRes.status === 200 && meRes.body.data.email === 'admin@test.com', 'GET /api/auth/me verifies Bearer token');

    // 3. Category & Product Management with RBAC Check
    console.log('\n[Phase 3] Categories & Products (RBAC & CRUD)');

    // Staff tries to create category -> Should be 403 Forbidden
    const staffCatRes = await request({
      method: 'POST',
      path: '/api/categories',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: { name: 'Electronics' },
    });
    assert(staffCatRes.status === 403, 'RBAC: Staff cannot create categories (403 Forbidden)');

    // Admin creates category
    const catRes = await request({
      method: 'POST',
      path: '/api/categories',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: 'Electronics', description: 'Gadgets and hardware' },
    });
    assert(catRes.status === 201, 'Admin can create category (201 Created)');
    const categoryId = catRes.body.data._id;

    // Admin creates product
    const prodRes = await request({
      method: 'POST',
      path: '/api/products',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Logitech MX Master 3',
        sku: 'LOG-MX3-BLK',
        description: 'Advanced wireless mouse',
        category: categoryId,
        price: 99.99,
        costPrice: 55.00,
        stock: 10,
        lowStockThreshold: 3,
        unit: 'pcs',
      },
    });
    assert(prodRes.status === 201, 'Admin creates product with stock 10 (201 Created)');
    const productId = prodRes.body.data._id;

    // 4. Customer Management
    console.log('\n[Phase 4] Customer Management');
    const custRes = await request({
      method: 'POST',
      path: '/api/customers',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1 555-9081',
        address: { street: '123 Market St', city: 'Metropolis' },
      },
    });
    assert(custRes.status === 201, 'Staff can create customer (201 Created)');
    const customerId = custRes.body.data._id;

    // 5. Stock Guard: Over-stock prevention
    console.log('\n[Phase 5] Order Creation & Stock Validation');
    const overflowOrderRes = await request({
      method: 'POST',
      path: '/api/orders',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        customerId,
        items: [{ productId, quantity: 15, price: 99.99 }], // Exceeds stock 10
      },
    });
    assert(overflowOrderRes.status === 400, 'Prevents ordering quantity exceeding available stock (400 Bad Request)');

    // Valid Order: Buy 4 items
    const validOrderRes = await request({
      method: 'POST',
      path: '/api/orders',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        customerId,
        items: [{ productId, quantity: 4, price: 99.99 }],
        discount: 10,
        tax: 25.00,
        paymentMethod: 'Cash',
      },
    });
    assert(validOrderRes.status === 201, 'Creates valid order with 4 items (201 Created)');
    const orderId = validOrderRes.body.data._id;
    const orderNumber = validOrderRes.body.data.orderNumber;

    // Verify stock is now 6 (10 - 4 = 6)
    const checkProduct = await Product.findById(productId);
    assert(checkProduct.stock === 6, `Product stock correctly decremented from 10 to 6 (Current: ${checkProduct.stock})`);

    // Verify Inventory Transaction logged
    const tx = await InventoryTransaction.findOne({ referenceOrder: orderId });
    assert(tx && tx.type === 'OUT' && tx.quantity === -4, 'InventoryTransaction logged automatically for order creation');

    // 6. Order Cancellation & Stock Restoration (Exact-Once)
    console.log('\n[Phase 6] Order Cancellation & Exact-Once Stock Restoration');
    const cancelRes = await request({
      method: 'PUT',
      path: `/api/orders/${orderId}/status`,
      headers: { Authorization: `Bearer ${staffToken}` },
      body: { status: 'Cancelled' },
    });
    assert(cancelRes.status === 200, 'Order successfully cancelled');

    const productAfterCancel = await Product.findById(productId);
    assert(productAfterCancel.stock === 10, `Stock restored back from 6 to 10 (Current: ${productAfterCancel.stock})`);

    // Try cancelling a second time -> should NOT double-restore stock
    await request({
      method: 'PUT',
      path: `/api/orders/${orderId}/status`,
      headers: { Authorization: `Bearer ${staffToken}` },
      body: { status: 'Cancelled' },
    });
    const productAfterDoubleCancel = await Product.findById(productId);
    assert(productAfterDoubleCancel.stock === 10, `Stock is NOT double restored on repeat cancel (Current: ${productAfterDoubleCancel.stock})`);

    // 7. Dashboard & Reports
    console.log('\n[Phase 7] Dashboard & Reporting Endpoints');
    const dashStats = await request({
      method: 'GET',
      path: '/api/dashboard/stats',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(dashStats.status === 200 && dashStats.body.data.totalProducts === 1, 'GET /api/dashboard/stats returns real MongoDB aggregations');

    const topProdRes = await request({
      method: 'GET',
      path: '/api/reports/top-products',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(topProdRes.status === 200, 'GET /api/reports/top-products returns 200');

    console.log('\n============================================================');
    console.log(` Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('============================================================\n');

    if (server) server.close();
    await closeDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Unhandled Test Runner Exception:', err);
    if (server) server.close();
    await closeDB();
    process.exit(1);
  }
};

runTests();
