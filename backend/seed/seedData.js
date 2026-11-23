const dotenv = require('dotenv');
dotenv.config();

const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const InventoryTransaction = require('../models/InventoryTransaction');

const executeSeed = async (isStandalone = false) => {
  try {
    if (isStandalone) {
      console.log('[Seed] Connecting to database...');
      await connectDB();
    }

    console.log('[Seed] Purging existing database records...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Order.deleteMany({}),
      InventoryTransaction.deleteMany({}),
    ]);

    console.log('[Seed] Seeding Default Users (Admin & Staff)...');
    // Admin user (cannot be created via public registration)
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@stockwise.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+1 (555) 019-2834',
      isActive: true,
    });

    // Staff user
    const staffUser = await User.create({
      name: 'John Staff',
      email: 'staff@stockwise.com',
      password: 'Staff@123',
      role: 'staff',
      phone: '+1 (555) 018-7743',
      isActive: true,
    });

    console.log('[Seed] Seeding Product Categories...');
    const categoriesData = [
      { name: 'Electronics & Gadgets', description: 'Computing gear, cables, wireless accessories, and tech items.' },
      { name: 'Office Supplies', description: 'Stationery, premium paper, desk organizers, and notebooks.' },
      { name: 'Packaging & Storage', description: 'Corrugated cartons, bubble wrap, industrial tape, and boxes.' },
      { name: 'Apparel & Uniforms', description: 'Workwear, cotton tees, safety vests, and caps.' },
      { name: 'Hardware & Maintenance', description: 'Hand tools, measurement tapes, screwdrivers, and fasteners.' },
    ];
    const createdCategories = await Category.insertMany(categoriesData);

    const catElectronics = createdCategories[0]._id;
    const catOffice = createdCategories[1]._id;
    const catPackaging = createdCategories[2]._id;
    const catApparel = createdCategories[3]._id;
    const catHardware = createdCategories[4]._id;

    console.log('[Seed] Seeding Products...');
    const productsData = [
      {
        name: 'Wireless Ergonomic Optical Mouse',
        sku: 'ELEC-MOU-001',
        description: '2.4GHz rechargeable wireless optical mouse with ergonomic comfort grip and silent clicks.',
        category: catElectronics,
        price: 24.99,
        costPrice: 12.50,
        stock: 45,
        lowStockThreshold: 10,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
      },
      {
        name: 'Mechanical Backlit Keyboard RGB',
        sku: 'ELEC-KBD-002',
        description: 'Full-size mechanical keyboard with tactile blue switches and custom dynamic RGB backlighting.',
        category: catElectronics,
        price: 69.99,
        costPrice: 38.00,
        stock: 18,
        lowStockThreshold: 5,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
      },
      {
        name: 'Braided USB-C Fast Charging Cable (2m)',
        sku: 'ELEC-CAB-003',
        description: 'Durable nylon-braided USB-C to USB-C cable supporting 100W PD fast charging.',
        category: catElectronics,
        price: 11.99,
        costPrice: 3.50,
        stock: 3, // Low stock on purpose
        lowStockThreshold: 8,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80',
      },
      {
        name: '4K Ultra-HD USB Webcam with Privacy Cover',
        sku: 'ELEC-CAM-004',
        description: 'Plug-and-play 4K autofocus webcam with dual noise-canceling stereo microphones.',
        category: catElectronics,
        price: 89.50,
        costPrice: 50.00,
        stock: 0, // Out of stock on purpose
        lowStockThreshold: 5,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&q=80',
      },
      {
        name: 'Executive Hardcover Grid Notebook A5',
        sku: 'OFF-NOT-001',
        description: '192-page 120gsm fountain pen friendly hardcover notebook with dual ribbon bookmarks.',
        category: catOffice,
        price: 14.50,
        costPrice: 5.50,
        stock: 60,
        lowStockThreshold: 15,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
      },
      {
        name: 'Gel Ink Rollerball Pen Set (10-Pack)',
        sku: 'OFF-PEN-002',
        description: 'Smooth writing quick-dry 0.5mm black gel pens with comfortable rubber grip.',
        category: catOffice,
        price: 9.99,
        costPrice: 3.20,
        stock: 35,
        lowStockThreshold: 10,
        unit: 'box',
        imageUrl: 'https://images.unsplash.com/photo-1585336261026-62024b896942?w=400&q=80',
      },
      {
        name: 'Heavy Duty Packaging Tape 6-Pack (48mm x 66m)',
        sku: 'PKG-TAP-001',
        description: 'Strong solvent adhesive brown parcel sealing tape for heavy boxes and shipping parcels.',
        category: catPackaging,
        price: 18.00,
        costPrice: 8.00,
        stock: 22,
        lowStockThreshold: 8,
        unit: 'pack',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
      },
      {
        name: 'Corrugated Shipping Boxes Medium (25-Pack)',
        sku: 'PKG-BOX-002',
        description: 'Standard 12x9x6 inch recyclable double-wall cardboard boxes for ecommerce orders.',
        category: catPackaging,
        price: 32.50,
        costPrice: 16.00,
        stock: 4, // Low stock on purpose
        lowStockThreshold: 10,
        unit: 'bundle',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80',
      },
      {
        name: 'Breathable Cotton Crewneck T-Shirt (Navy)',
        sku: 'APP-TEE-001',
        description: '100% pre-shrunk ring-spun combed cotton retail apparel tee, size M-XL.',
        category: catApparel,
        price: 19.99,
        costPrice: 7.00,
        stock: 50,
        lowStockThreshold: 12,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80',
      },
      {
        name: 'Hi-Vis Reflective Safety Vest with Pockets',
        sku: 'APP-VST-002',
        description: 'ANSI Class 2 compliant high visibility neon yellow vest with 2-inch reflective strips.',
        category: catApparel,
        price: 13.50,
        costPrice: 4.80,
        stock: 28,
        lowStockThreshold: 6,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=400&q=80',
      },
      {
        name: 'Compact 25ft Steel Measuring Tape',
        sku: 'HRD-TAP-001',
        description: 'Heavy duty rubberized measuring tape with auto-lock and fractional blade markings.',
        category: catHardware,
        price: 12.99,
        costPrice: 5.00,
        stock: 15,
        lowStockThreshold: 5,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&q=80',
      },
      {
        name: '6-in-1 Multi-Bit Magnetic Screwdriver Set',
        sku: 'HRD-SCR-002',
        description: 'Ergonomic bi-material handle screwdriver with reversible Phillips and slotted bits.',
        category: catHardware,
        price: 16.49,
        costPrice: 6.20,
        stock: 2, // Low stock on purpose
        lowStockThreshold: 5,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&q=80',
      },
    ];

    const createdProducts = await Product.insertMany(productsData);

    console.log('[Seed] Logging Initial Inventory Transactions...');
    for (const p of createdProducts) {
      if (p.stock > 0) {
        await InventoryTransaction.create({
          product: p._id,
          type: 'IN',
          reason: 'INITIAL_STOCK',
          quantity: p.stock,
          previousStock: 0,
          newStock: p.stock,
          performedBy: adminUser._id,
          notes: 'Initial warehouse inventory stock',
        });
      }
    }

    console.log('[Seed] Seeding Customers...');
    const customersData = [
      {
        name: 'Robert Vance',
        email: 'robert.vance@vancerefrigeration.com',
        phone: '+1 (555) 234-5678',
        address: { street: '42 Industrial Park Blvd', city: 'Scranton', state: 'PA', postalCode: '18503', country: 'USA' },
        notes: 'Commercial account - prefers bulk billing.',
      },
      {
        name: 'Elena Rostova',
        email: 'elena.rostova@nexusretail.io',
        phone: '+1 (555) 876-5432',
        address: { street: '782 Market Plaza, Suite 4B', city: 'Austin', state: 'TX', postalCode: '78701', country: 'USA' },
        notes: 'Regular online boutique retailer.',
      },
      {
        name: 'Marcus Holloway',
        email: 'marcus.h@techcraft.dev',
        phone: '+1 (555) 345-6789',
        address: { street: '109 Silicon Way', city: 'San Jose', state: 'CA', postalCode: '95113', country: 'USA' },
        notes: 'Software house office manager.',
      },
      {
        name: 'Sarah Jenkins',
        email: 'sarah.j@cornercafe.org',
        phone: '+1 (555) 456-7890',
        address: { street: '512 Pinecrest Ave', city: 'Seattle', state: 'WA', postalCode: '98101', country: 'USA' },
        notes: 'Local retail buyer.',
      },
      {
        name: 'David Kim',
        email: 'david.kim@apexlogistics.net',
        phone: '+1 (555) 567-8901',
        address: { street: '900 Freight Terminal Rd', city: 'Chicago', state: 'IL', postalCode: '60607', country: 'USA' },
        notes: 'Warehouse supplies account.',
      },
    ];

    const createdCustomers = await Customer.insertMany(customersData);

    console.log('[Seed] Seeding Sample Orders...');
    const now = new Date();
    const dayAgo = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d;
    };

    const ordersToSeed = [
      {
        orderNumber: 'ORD-20261118-0001',
        customer: createdCustomers[0]._id,
        items: [
          {
            product: createdProducts[0]._id,
            name: createdProducts[0].name,
            sku: createdProducts[0].sku,
            quantity: 2,
            price: createdProducts[0].price,
            subtotal: 49.98,
          },
          {
            product: createdProducts[4]._id,
            name: createdProducts[4].name,
            sku: createdProducts[4].sku,
            quantity: 3,
            price: createdProducts[4].price,
            subtotal: 43.50,
          },
        ],
        subtotal: 93.48,
        discount: 5.00,
        discountType: 'fixed',
        tax: 7.08,
        total: 95.56,
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        stockRestored: false,
        createdBy: staffUser._id,
        notes: 'Delivered directly to warehouse desk',
        createdAt: dayAgo(5),
      },
      {
        orderNumber: 'ORD-20261119-0002',
        customer: createdCustomers[1]._id,
        items: [
          {
            product: createdProducts[1]._id,
            name: createdProducts[1].name,
            sku: createdProducts[1].sku,
            quantity: 1,
            price: createdProducts[1].price,
            subtotal: 69.99,
          },
          {
            product: createdProducts[2]._id,
            name: createdProducts[2].name,
            sku: createdProducts[2].sku,
            quantity: 2,
            price: createdProducts[2].price,
            subtotal: 23.98,
          },
        ],
        subtotal: 93.97,
        discount: 0,
        discountType: 'fixed',
        tax: 7.52,
        total: 101.49,
        paymentMethod: 'Credit Card',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        stockRestored: false,
        createdBy: adminUser._id,
        notes: 'Priority air express',
        createdAt: dayAgo(4),
      },
      {
        orderNumber: 'ORD-20261120-0003',
        customer: createdCustomers[2]._id,
        items: [
          {
            product: createdProducts[6]._id,
            name: createdProducts[6].name,
            sku: createdProducts[6].sku,
            quantity: 4,
            price: createdProducts[6].price,
            subtotal: 72.00,
          },
          {
            product: createdProducts[7]._id,
            name: createdProducts[7].name,
            sku: createdProducts[7].sku,
            quantity: 2,
            price: createdProducts[7].price,
            subtotal: 65.00,
          },
        ],
        subtotal: 137.00,
        discount: 10.00,
        discountType: 'percentage', // 10%
        tax: 9.86,
        total: 133.16,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Paid',
        orderStatus: 'Shipped',
        stockRestored: false,
        createdBy: staffUser._id,
        notes: 'Dispatch confirmed via FedEx',
        createdAt: dayAgo(3),
      },
      {
        orderNumber: 'ORD-20261121-0004',
        customer: createdCustomers[3]._id,
        items: [
          {
            product: createdProducts[8]._id,
            name: createdProducts[8].name,
            sku: createdProducts[8].sku,
            quantity: 5,
            price: createdProducts[8].price,
            subtotal: 99.95,
          },
        ],
        subtotal: 99.95,
        discount: 0,
        discountType: 'fixed',
        tax: 8.00,
        total: 107.95,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'Pending',
        orderStatus: 'Processing',
        stockRestored: false,
        createdBy: staffUser._id,
        notes: 'Call before delivery',
        createdAt: dayAgo(2),
      },
      {
        orderNumber: 'ORD-20261122-0005',
        customer: createdCustomers[4]._id,
        items: [
          {
            product: createdProducts[10]._id,
            name: createdProducts[10].name,
            sku: createdProducts[10].sku,
            quantity: 2,
            price: createdProducts[10].price,
            subtotal: 25.98,
          },
          {
            product: createdProducts[11]._id,
            name: createdProducts[11].name,
            sku: createdProducts[11].sku,
            quantity: 1,
            price: createdProducts[11].price,
            subtotal: 16.49,
          },
        ],
        subtotal: 42.47,
        discount: 0,
        discountType: 'fixed',
        tax: 3.40,
        total: 45.87,
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        orderStatus: 'Pending',
        stockRestored: false,
        createdBy: staffUser._id,
        notes: 'In-store pickup counter',
        createdAt: dayAgo(1),
      },
      {
        orderNumber: 'ORD-20261123-0006',
        customer: createdCustomers[0]._id,
        items: [
          {
            product: createdProducts[0]._id,
            name: createdProducts[0].name,
            sku: createdProducts[0].sku,
            quantity: 1,
            price: createdProducts[0].price,
            subtotal: 24.99,
          },
        ],
        subtotal: 24.99,
        discount: 0,
        discountType: 'fixed',
        tax: 2.00,
        total: 26.99,
        paymentMethod: 'Cash',
        paymentStatus: 'Failed',
        orderStatus: 'Cancelled',
        stockRestored: true, // Already restored
        createdBy: adminUser._id,
        notes: 'Customer changed mind before dispatch - stock restored',
        createdAt: now,
      },
    ];

    for (const ordData of ordersToSeed) {
      await Order.create(ordData);

      // Update customer stats for non-cancelled orders
      if (ordData.orderStatus !== 'Cancelled') {
        await Customer.findByIdAndUpdate(ordData.customer, {
          $inc: {
            totalOrders: 1,
            totalSpent: ordData.total,
          },
        });
      }
    }

    console.log('====================================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log(' Created:');
    console.log('   - 2 Users (Admin & Staff)');
    console.log('   - 5 Product Categories');
    console.log('   - 12 Products with rich data & low-stock test cases');
    console.log('   - 5 Customers with order records');
    console.log('   - 6 Orders across multiple statuses and dates');
    console.log('   - Inventory transaction history');
    console.log('----------------------------------------------------');
    console.log(' Admin Credentials:');
    console.log('   Email:    admin@stockwise.com');
    console.log('   Password: Admin@123');
    console.log(' Staff Credentials:');
    console.log('   Email:    staff@stockwise.com');
    console.log('   Password: Staff@123');
    console.log('====================================================');

    if (isStandalone) {
      await closeDB();
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Error]:', error);
    if (isStandalone) {
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Automatically seeds the database if no users exist
 */
const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[AutoSeed] No users found in database. Automatically populating default admin, staff & demo data...');
      await executeSeed(false);
      console.log('[AutoSeed] Auto-seeding completed. Default credentials ready to login.');
    } else {
      console.log(`[AutoSeed] Database verified with ${userCount} existing users.`);
    }
  } catch (err) {
    console.error('[AutoSeed Error]:', err.message);
  }
};

if (require.main === module) {
  executeSeed(true);
}

module.exports = { executeSeed, autoSeedIfEmpty };
