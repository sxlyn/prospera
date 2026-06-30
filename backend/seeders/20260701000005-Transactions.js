'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transactions = [];
    const transactionDetails = [];
    const now = new Date();
    let transactionIdCounter = 1;
    let detailIdCounter = 1;

    // Helper to generate a random number between min and max
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Build product lookup based on what we seeded
    const products = [];
    // 1-5 Best Sellers
    products.push({ id: 1, cost: 2000, price: 3500, type: 'best' });
    products.push({ id: 2, cost: 2500, price: 3500, type: 'best' });
    products.push({ id: 3, cost: 12000, price: 16000, type: 'best' });
    products.push({ id: 4, cost: 18000, price: 25000, type: 'best' });
    products.push({ id: 5, cost: 60000, price: 72000, type: 'best' });
    
    // 6-30 Regulars
    for(let i=6; i<=30; i++) {
        products.push({ id: i, cost: 5000, price: 6500, type: 'regular' }); // approximate cost/price for logic
    }
    // 31-37 Dead Stock
    for(let i=31; i<=37; i++) {
        products.push({ id: i, cost: 15000, price: 22500, type: 'dead' });
    }
    // 38-40 Edge cases
    products.push({ id: 38, cost: 25000, price: 32000, type: 'edge' });
    products.push({ id: 39, cost: 18000, price: 24000, type: 'edge' });
    products.push({ id: 40, cost: 30000, price: 40000, type: 'edge' });

    // Generate natural sales over the last 60 days
    for (let dayOffset = 60; dayOffset >= 0; dayOffset--) {
      const currentDate = new Date(now);
      currentDate.setDate(now.getDate() - dayOffset);
      
      const isWeekend = (currentDate.getDay() === 0 || currentDate.getDay() === 6);
      
      // Randomly generate transactions per day (Weekend Spikes)
      let txCount = getRandomInt(4, 8);
      if (isWeekend) {
          txCount = getRandomInt(9, 15); // Weekend spike
      }
      
      for (let i = 0; i < txCount; i++) {
        // distribute hours
        currentDate.setHours(getRandomInt(8, 21), getRandomInt(0, 59), getRandomInt(0, 59));
        
        // Random cashier (id 2 or 3)
        const cashierId = getRandomInt(2, 3);

        const numItems = getRandomInt(1, 4);
        let totalAmount = 0;
        const currentTxDetails = [];

        for (let j = 0; j < numItems; j++) {
          // Pareto distribution logic for picking a product
          let r = Math.random();
          let pTarget;
          if (r < 0.6) {
              pTarget = products[getRandomInt(0, 4)]; // Best seller (60% chance)
          } else if (r < 0.95) {
              pTarget = products[getRandomInt(5, 29)]; // Regular (35% chance)
          } else if (r < 0.98) {
              pTarget = products[getRandomInt(30, 36)]; // Dead stock (3% chance)
          } else {
              pTarget = products[getRandomInt(37, 39)]; // Edge case (2% chance)
          }
          
          const qty = getRandomInt(1, 5);
          let sellingPrice = pTarget.price;
          
          // Force Markdown (Rugi) for edge cases on random late days
          if (pTarget.type === 'edge' && dayOffset < 10 && Math.random() > 0.5) {
              sellingPrice = pTarget.cost - 5000; // Sell below cost!
          }

          const subTotal = sellingPrice * qty;
          totalAmount += subTotal;

          currentTxDetails.push({
            detail_id: detailIdCounter++,
            transaction_id_fk: transactionIdCounter,
            product_id_fk: pTarget.id,
            quantity: qty,
            capital_cost: pTarget.cost,
            selling_price: sellingPrice,
            transaction_type: 'sell',
            sub_total: subTotal,
            deletedAt: null
          });
        }

        const exactTime = new Date(currentDate);

        transactions.push({
          transaction_id: transactionIdCounter,
          user_id_fk: 1,
          cashier_id: cashierId,
          total_amount: totalAmount,
          transaction_type: 'sell',
          transaction_datetime: exactTime,
          created_at: exactTime,     // Override specific backend field
          status: 'success',
          deletedAt: null
        });

        transactionDetails.push(...currentTxDetails);
        transactionIdCounter++;
      }
    }

    await queryInterface.bulkInsert('Transactions', transactions, {});
    await queryInterface.bulkInsert('Transaction_details', transactionDetails, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Transaction_details', null, {});
    await queryInterface.bulkDelete('Transactions', null, {});
  }
};
