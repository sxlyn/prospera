'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const productPrices = {
      1: { cost: 3000, price: 5000 }, 2: { cost: 1500, price: 3000 }, 3: { cost: 6000, price: 9000 },
      4: { cost: 45000, price: 55000 }, 5: { cost: 40000, price: 50000 }, 6: { cost: 1000, price: 2000 },
      7: { cost: 500, price: 1000 }, 8: { cost: 3000, price: 5000 }, 9: { cost: 1500, price: 3000 },
      10: { cost: 4000, price: 6500 }, 11: { cost: 3000, price: 5000 }, 12: { cost: 4000, price: 7000 },
      13: { cost: 2500, price: 4500 }, 14: { cost: 5000, price: 8500 }, 15: { cost: 2000, price: 4000 },
      16: { cost: 1500, price: 3000 }, 17: { cost: 6000, price: 10000 }, 18: { cost: 1500, price: 2500 },
      19: { cost: 5000, price: 8500 }, 20: { cost: 2000, price: 4000 }, 21: { cost: 5000, price: 8500 },
      22: { cost: 9000, price: 14000 }, 23: { cost: 12000, price: 18000 }, 24: { cost: 10000, price: 16000 },
      25: { cost: 2000, price: 3500 }, 26: { cost: 10000, price: 15000 }, 27: { cost: 3000, price: 5500 },
      28: { cost: 4000, price: 7000 }, 29: { cost: 6000, price: 9500 }, 30: { cost: 6000, price: 9500 }
    };

    const transactionsData = [];
    const transactionDetailsData = [];
    let currentTransactionId = 1;

    for (let i = 1; i <= 100; i++) {
      const start = new Date(2026, 1, 1).getTime(); 
      const end = new Date(2026, 3, 29).getTime(); 
      const randomDate = new Date(start + Math.random() * (end - start));
      const formattedDate = randomDate.toISOString().slice(0, 19).replace('T', ' ');

      const numItems = Math.floor(Math.random() * 4) + 1; 
      let totalAmount = 0;

      const statusOptions = ['success', 'success', 'success', 'success', 'success', 'success', 'success', 'cancelled', 'cancelled', 'pending'];
      const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];

      for (let j = 0; j < numItems; j++) {
        const productId = Math.floor(Math.random() * 30) + 1;
        const qty = Math.floor(Math.random() * 3) + 1;
        
        const cost = productPrices[productId].cost;
        let price = productPrices[productId].price;

        if (Math.random() < 0.10) {
          const kerugian = Math.floor(Math.random() * 2 + 1) * 500; 
          price = cost - kerugian;
          
          if (price <= 0) {
            price = cost - 100; 
          }
        }

        const subTotal = price * qty;
        totalAmount += subTotal;

        transactionDetailsData.push({
          transaction_id_fk: currentTransactionId,
          product_id_fk: productId,
          quantity: qty,
          capital_cost: cost,
          selling_price: price,  
          sub_total: subTotal
        });
      }

      transactionsData.push({
        user_id_fk: 1, 
        total_amount: totalAmount,
        status: randomStatus,
        transaction_datetime: formattedDate
      });
      currentTransactionId++;
    }

    const outlierDate = "2026-04-27 10:00:00"; 
    
    transactionDetailsData.push({
      transaction_id_fk: currentTransactionId,
      product_id_fk: 4, 
      quantity: 150, 
      capital_cost: 45000,
      selling_price: 55000,  
      sub_total: 55000 * 150 
    });

    transactionsData.push({
      user_id_fk: 1, 
      total_amount: 8250000, 
      status: 'success', 
      transaction_datetime: outlierDate
    });
    
    currentTransactionId++;

    await queryInterface.bulkInsert('Transactions', transactionsData, {});
    await queryInterface.bulkInsert('Transaction_details', transactionDetailsData, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Transaction_details', null, {});
    await queryInterface.bulkDelete('Transactions', null, {});
  }
};