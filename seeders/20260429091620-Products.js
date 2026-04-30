'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Products', [
      { user_id_fk: 1, product_name: 'Buku Tulis A5 50 Lembar', product_cost: 3000, product_price: 5000, product_stock: 100 },
      { user_id_fk: 1, product_name: 'Pulpen Tinta Gel Hitam', product_cost: 1500, product_price: 3000, product_stock: 150 },
      { user_id_fk: 1, product_name: 'Spidol Papan Tulis (Hitam)', product_cost: 6000, product_price: 9000, product_stock: 50 },
      { user_id_fk: 1, product_name: 'Kertas HVS A4 80gsm (1 Rim)', product_cost: 45000, product_price: 55000, product_stock: 20 },
      { user_id_fk: 1, product_name: 'Kertas HVS F4 70gsm (1 Rim)', product_cost: 40000, product_price: 50000, product_stock: 25 },
      { user_id_fk: 1, product_name: 'Pensil 2B (Faber-Castell)', product_cost: 1000, product_price: 2000, product_stock: 200 },
      { user_id_fk: 1, product_name: 'Penghapus Karet Hitam', product_cost: 500, product_price: 1000, product_stock: 150 },
      { user_id_fk: 1, product_name: 'Penggaris Besi 30cm', product_cost: 3000, product_price: 5000, product_stock: 60 },
      { user_id_fk: 1, product_name: 'Penggaris Plastik 30cm', product_cost: 1500, product_price: 3000, product_stock: 80 },
      { user_id_fk: 1, product_name: 'Tipe-X (Correction Pen)', product_cost: 4000, product_price: 6500, product_stock: 60 },
      { user_id_fk: 1, product_name: 'Lem Kertas Stick', product_cost: 3000, product_price: 5000, product_stock: 40 },
      { user_id_fk: 1, product_name: 'Lem G (Super Glue)', product_cost: 4000, product_price: 7000, product_stock: 30 },
      { user_id_fk: 1, product_name: 'Gunting Kecil', product_cost: 2500, product_price: 4500, product_stock: 35 },
      { user_id_fk: 1, product_name: 'Gunting Besar', product_cost: 5000, product_price: 8500, product_stock: 25 },
      { user_id_fk: 1, product_name: 'Cutter Kecil', product_cost: 2000, product_price: 4000, product_stock: 40 },
      { user_id_fk: 1, product_name: 'Isi Cutter Kecil (1 Tube)', product_cost: 1500, product_price: 3000, product_stock: 50 },
      { user_id_fk: 1, product_name: 'Stapler Kecil', product_cost: 6000, product_price: 10000, product_stock: 30 },
      { user_id_fk: 1, product_name: 'Isi Staples No. 10 (1 Kotak)', product_cost: 1500, product_price: 2500, product_stock: 100 },
      { user_id_fk: 1, product_name: 'Binder Clip No. 107 (1 Box)', product_cost: 5000, product_price: 8500, product_stock: 20 },
      { user_id_fk: 1, product_name: 'Paper Clip (1 Box)', product_cost: 2000, product_price: 4000, product_stock: 50 },
      { user_id_fk: 1, product_name: 'Buku Gambar A3', product_cost: 5000, product_price: 8500, product_stock: 30 },
      { user_id_fk: 1, product_name: 'Krayon 12 Warna', product_cost: 9000, product_price: 14000, product_stock: 20 },
      { user_id_fk: 1, product_name: 'Pensil Warna 12 Warna', product_cost: 12000, product_price: 18000, product_stock: 25 },
      { user_id_fk: 1, product_name: 'Spidol Warna 12 Warna', product_cost: 10000, product_price: 16000, product_stock: 30 },
      { user_id_fk: 1, product_name: 'Map Plastik Kancing (Bening)', product_cost: 2000, product_price: 3500, product_stock: 100 },
      { user_id_fk: 1, product_name: 'Map Kertas Biasa (1 Pack)', product_cost: 10000, product_price: 15000, product_stock: 20 },
      { user_id_fk: 1, product_name: 'Sticky Notes 3x3 (Kuning)', product_cost: 3000, product_price: 5500, product_stock: 50 },
      { user_id_fk: 1, product_name: 'Highlighter (Stabilo) Kuning', product_cost: 4000, product_price: 7000, product_stock: 45 },
      { user_id_fk: 1, product_name: 'Lakban Bening', product_cost: 6000, product_price: 9500, product_stock: 40 },
      { user_id_fk: 1, product_name: 'Lakban Hitam', product_cost: 6000, product_price: 9500, product_stock: 40 }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Products', null, {});
  }
};