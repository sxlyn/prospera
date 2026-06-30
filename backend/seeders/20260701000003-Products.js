'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const products = [];
    const now = new Date();
    let productIdCounter = 1;

    // Helper Date
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 5);

    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const sixMonths = new Date(now);
    sixMonths.setMonth(sixMonths.getMonth() + 6);

    const pastExpiry = new Date(now);
    pastExpiry.setDate(pastExpiry.getDate() - 15);

    // 1. The Best Sellers (5)
    const bestSellers = [
      { name: 'Air Mineral Aqua 600ml', cost: 2000, price: 3500, cat: 2, expiry: sixMonths, stock: 300, minDisplay: 50 },
      { name: 'Indomie Goreng Spesial', cost: 2500, price: 3500, cat: 1, expiry: sixMonths, stock: 400, minDisplay: 100 },
      { name: 'Roti Tawar Sari Roti', cost: 12000, price: 16000, cat: 1, expiry: nextMonth, stock: 30, minDisplay: 10 },
      { name: 'Telur Ayam Kampung 10pcs', cost: 18000, price: 25000, cat: 3, expiry: nextMonth, stock: 50, minDisplay: 15 },
      { name: 'Beras Ramos 5kg', cost: 60000, price: 72000, cat: 3, expiry: sixMonths, stock: 40, minDisplay: 10 },
    ];
    for (let p of bestSellers) {
      products.push({
        product_id: productIdCounter++, user_id_fk: 1, product_name: p.name, product_cost: p.cost, product_price: p.price,
        product_stock: p.stock, category_id_fk: p.cat, expired_date: p.expiry, min_display_qty: p.minDisplay, calculated_reorder_point: 0,
        createdAt: now, updatedAt: now, deletedAt: null
      });
    }

    // 2. The Regulars (25)
    const regularNames = ['Sabun Lifebuoy', 'Shampo Clear', 'Pasta Gigi Pepsodent', 'Susu Indomilk', 'Kopi Kapal Api', 'Teh Pucuk', 'Minyak Bimoli 2L', 'Gula Gulaku 1kg', 'Tepung Segitiga Biru', 'Kecap Bango', 'Saus Sambal ABC', 'Kacang Garuda', 'Silverqueen', 'Tango Wafer', 'Chitato', 'Sprite 1.5L', 'Coca Cola', 'Pocari Sweat', 'Oreo', 'Beng Beng', 'Sunlight Cair', 'Rinso Anti Noda', 'Pewangi Downy', 'Sikat Gigi Formula', 'Hand Sanitizer'];
    for (let i = 0; i < 25; i++) {
      let cost = 5000 + (Math.floor(Math.random() * 20) * 1000);
      let isFood = i % 2 !== 0;
      products.push({
        product_id: productIdCounter++, user_id_fk: 1, product_name: regularNames[i] || `Produk Regular ${i}`, product_cost: cost, product_price: cost * 1.3,
        product_stock: 50 + Math.floor(Math.random() * 100), category_id_fk: isFood ? 1 : 4, expired_date: isFood ? sixMonths : null, min_display_qty: 15, calculated_reorder_point: 0,
        createdAt: now, updatedAt: now, deletedAt: null
      });
    }

    // 3. The Dead Stock (7)
    const deadStockNames = ['Sikat WC Premium', 'Baterai ABC Besar', 'Lampu LED Philips 20W', 'Sapu Ijuk', 'Pembersih Kaca', 'Racun Tikus', 'Payung Lipat'];
    for (let i = 0; i < 7; i++) {
      let stock = Math.floor(Math.random() * 3) + 2; // VERY LOW STOCK to trigger warnings
      let cost = 15000 + (Math.floor(Math.random() * 10) * 5000);
      products.push({
        product_id: productIdCounter++, user_id_fk: 1, product_name: deadStockNames[i], product_cost: cost, product_price: cost * 1.5,
        product_stock: stock, category_id_fk: 5, expired_date: null, min_display_qty: 10, calculated_reorder_point: 5,
        createdAt: now, updatedAt: now, deletedAt: null
      });
    }

    // 4. The Edge Cases (3)
    products.push({ // Expiring next week
        product_id: productIdCounter++, user_id_fk: 1, product_name: 'Susu Segar Greenfield', product_cost: 25000, product_price: 32000,
        product_stock: 12, category_id_fk: 2, expired_date: nextWeek, min_display_qty: 5, calculated_reorder_point: 0,
        createdAt: now, updatedAt: now, deletedAt: null
    });
    products.push({ // Expiring next week
        product_id: productIdCounter++, user_id_fk: 1, product_name: 'Keju Kraft Slice', product_cost: 18000, product_price: 24000,
        product_stock: 8, category_id_fk: 3, expired_date: nextWeek, min_display_qty: 3, calculated_reorder_point: 0,
        createdAt: now, updatedAt: now, deletedAt: null
    });
    products.push({ // Already Expired
        product_id: productIdCounter++, user_id_fk: 1, product_name: 'Sosis Ayam Champ', product_cost: 30000, product_price: 40000,
        product_stock: 0, category_id_fk: 1, expired_date: pastExpiry, min_display_qty: 5, calculated_reorder_point: 0,
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), updatedAt: now, deletedAt: null
    });

    await queryInterface.bulkInsert('Products', products, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Products', null, {});
  }
};
