const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { Category, MenuItem } = require('../models/Menu');
const { Table } = require('../models/Table');

exports.seedInitialData = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) return;

    console.log('🌱 Seeding initial data...');

    // Create demo restaurant
    const restaurant = await Restaurant.create({
      name: 'FLAVOUR Restaurant',
      type: 'restaurant',
      phone: '+919999999999',
      address: { street: '123 MG Road', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
      facilities: { dineIn: true, delivery: true, pickup: true, tableReservation: true },
      taxSettings: { cgst: 2.5, sgst: 2.5 }
    });

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@flavour.com',
      password: 'admin123',
      phone: '+919999999999',
      role: 'admin',
      restaurant: restaurant._id,
      permissions: {
        canManageOrders: true, canManageMenu: true, canManageStaff: true,
        canViewReports: true, canManageInventory: true, canManageCashRegister: true
      }
    });

    restaurant.owner = admin._id;
    await restaurant.save();

    // Create categories
    const categories = await Category.insertMany([
      { name: 'Starters', icon: '🥗', color: '#FF6B35', restaurant: restaurant._id, sortOrder: 1 },
      { name: 'Main Course', icon: '🍛', color: '#E63946', restaurant: restaurant._id, sortOrder: 2 },
      { name: 'Breads', icon: '🫓', color: '#F4A261', restaurant: restaurant._id, sortOrder: 3 },
      { name: 'Rice & Biryani', icon: '🍚', color: '#2A9D8F', restaurant: restaurant._id, sortOrder: 4 },
      { name: 'Beverages', icon: '🥤', color: '#457B9D', restaurant: restaurant._id, sortOrder: 5 },
      { name: 'Desserts', icon: '🍮', color: '#E9C46A', restaurant: restaurant._id, sortOrder: 6 },
      { name: 'Fast Food', icon: '🍔', color: '#E76F51', restaurant: restaurant._id, sortOrder: 7 },
    ]);

    const [starters, mainCourse, breads, rice, beverages, desserts, fastFood] = categories;

    // Create menu items
    await MenuItem.insertMany([
      // Starters
      { name: 'Paneer Tikka', price: 220, category: starters._id, restaurant: restaurant._id, isVeg: true, prepTime: 20, tags: ['bestseller'], spiceLevel: 'medium' },
      { name: 'Chicken Tikka', price: 280, category: starters._id, restaurant: restaurant._id, isVeg: false, prepTime: 25, tags: ['bestseller'], spiceLevel: 'medium' },
      { name: 'Veg Spring Roll', price: 160, category: starters._id, restaurant: restaurant._id, isVeg: true, prepTime: 15 },
      { name: 'Chicken Lollipop', price: 320, category: starters._id, restaurant: restaurant._id, isVeg: false, prepTime: 25, spiceLevel: 'hot' },
      { name: 'Hara Bhara Kabab', price: 180, category: starters._id, restaurant: restaurant._id, isVeg: true, prepTime: 20 },
      // Main Course
      { name: 'Butter Chicken', price: 320, category: mainCourse._id, restaurant: restaurant._id, isVeg: false, prepTime: 30, tags: ['bestseller', 'chef_special'] },
      { name: 'Paneer Butter Masala', price: 280, category: mainCourse._id, restaurant: restaurant._id, isVeg: true, prepTime: 25, tags: ['bestseller'] },
      { name: 'Dal Makhani', price: 220, category: mainCourse._id, restaurant: restaurant._id, isVeg: true, prepTime: 20 },
      { name: 'Chicken Korma', price: 340, category: mainCourse._id, restaurant: restaurant._id, isVeg: false, prepTime: 35 },
      { name: 'Palak Paneer', price: 260, category: mainCourse._id, restaurant: restaurant._id, isVeg: true, prepTime: 20 },
      { name: 'Mutton Rogan Josh', price: 420, category: mainCourse._id, restaurant: restaurant._id, isVeg: false, prepTime: 45, spiceLevel: 'hot' },
      // Breads
      { name: 'Butter Naan', price: 40, category: breads._id, restaurant: restaurant._id, isVeg: true, prepTime: 10 },
      { name: 'Garlic Naan', price: 55, category: breads._id, restaurant: restaurant._id, isVeg: true, prepTime: 10 },
      { name: 'Tandoori Roti', price: 30, category: breads._id, restaurant: restaurant._id, isVeg: true, prepTime: 8 },
      { name: 'Paratha', price: 60, category: breads._id, restaurant: restaurant._id, isVeg: true, prepTime: 12 },
      // Rice & Biryani
      { name: 'Chicken Biryani', price: 380, category: rice._id, restaurant: restaurant._id, isVeg: false, prepTime: 40, tags: ['bestseller', 'chef_special'] },
      { name: 'Veg Biryani', price: 280, category: rice._id, restaurant: restaurant._id, isVeg: true, prepTime: 35, tags: ['bestseller'] },
      { name: 'Steamed Rice', price: 80, category: rice._id, restaurant: restaurant._id, isVeg: true, prepTime: 15 },
      { name: 'Jeera Rice', price: 120, category: rice._id, restaurant: restaurant._id, isVeg: true, prepTime: 15 },
      { name: 'Mutton Biryani', price: 450, category: rice._id, restaurant: restaurant._id, isVeg: false, prepTime: 50, tags: ['chef_special'] },
      // Beverages
      { name: 'Mango Lassi', price: 90, category: beverages._id, restaurant: restaurant._id, isVeg: true, prepTime: 5 },
      { name: 'Masala Chai', price: 40, category: beverages._id, restaurant: restaurant._id, isVeg: true, prepTime: 5 },
      { name: 'Fresh Lime Soda', price: 70, category: beverages._id, restaurant: restaurant._id, isVeg: true, prepTime: 5 },
      { name: 'Cold Coffee', price: 120, category: beverages._id, restaurant: restaurant._id, isVeg: true, prepTime: 5 },
      { name: 'Watermelon Juice', price: 80, category: beverages._id, restaurant: restaurant._id, isVeg: true, prepTime: 5 },
      // Desserts
      { name: 'Gulab Jamun', price: 80, category: desserts._id, restaurant: restaurant._id, isVeg: true, prepTime: 5 },
      { name: 'Rasgulla', price: 80, category: desserts._id, restaurant: restaurant._id, isVeg: true, prepTime: 5 },
      { name: 'Kulfi', price: 100, category: desserts._id, restaurant: restaurant._id, isVeg: true, prepTime: 3 },
      { name: 'Ice Cream', price: 120, category: desserts._id, restaurant: restaurant._id, isVeg: true, prepTime: 3 },
      // Fast Food
      { name: 'Veg Burger', price: 120, category: fastFood._id, restaurant: restaurant._id, isVeg: true, prepTime: 10 },
      { name: 'Chicken Burger', price: 180, category: fastFood._id, restaurant: restaurant._id, isVeg: false, prepTime: 12, tags: ['bestseller'] },
      { name: 'French Fries', price: 90, category: fastFood._id, restaurant: restaurant._id, isVeg: true, prepTime: 8 },
      { name: 'Cheese Pizza', price: 250, category: fastFood._id, restaurant: restaurant._id, isVeg: true, prepTime: 20 },
    ]);

    // Create tables
    const tableData = [];
    for (let i = 1; i <= 12; i++) {
      tableData.push({
        tableNumber: `T${String(i).padStart(2, '0')}`,
        name: i <= 4 ? `Window ${i}` : i <= 8 ? `Hall ${i-4}` : `VIP ${i-8}`,
        restaurant: restaurant._id,
        capacity: i > 10 ? 8 : i > 6 ? 4 : 2,
        section: i > 10 ? 'VIP' : i > 6 ? 'Main Hall' : 'Window Side'
      });
    }
    await Table.insertMany(tableData);

    console.log('✅ Demo data seeded successfully!');
    console.log('📧 Admin Login: admin@flavour.com | Password: admin123');
  } catch (err) {
    if (err.code !== 11000) console.error('Seeder error:', err.message);
  }
};
