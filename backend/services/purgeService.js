/**
 * purgeService.js — Hard Purge Service (Right to be Forgotten)
 * FIX (HIGH-02): Implementasi UU PDP Pasal 35 — Hak Penghapusan Data (Right to be Forgotten)
 *
 * Fungsi hardPurgeStore() menghapus SELURUH jejak data satu toko (tenant) secara permanen
 * dari database aktif, mengikuti urutan yang aman sesuai foreign key constraint.
 *
 * URUTAN HAPUS (dependency-safe):
 *   1. InventoryLogs    → FK ke Product, User
 *   2. AnomalyTickets   → FK ke User, Transaction, TransactionDetail
 *   3. TransactionDetails → FK ke Transaction, Product
 *   4. Transactions     → FK ke User
 *   5. StoreSettings    → FK ke User
 *   6. Products         → FK ke User, Category
 *   7. Karyawan (Users with owner_id = storeId) → FK ke User
 *   8. Owner User       → Root record
 *
 * PENTING: Semua operasi dijalankan dalam SATU transaksi database (ACID).
 * Jika ada langkah yang gagal, seluruh penghapusan di-rollback — tidak ada data
 * yang terhapus sebagian (partial delete).
 *
 * @param {object} sequelizeInstance - Instance sequelize dari models/index.js
 * @param {object} models - Semua model Sequelize { User, Product, ... }
 * @param {number} storeOwnerId - user_id dari Owner yang akun tokonya akan dihapus
 * @returns {Promise<object>} Ringkasan jumlah baris yang dihapus per tabel
 */
const hardPurgeStore = async (sequelizeInstance, models, storeOwnerId) => {
    const { User, Product, Transaction, TransactionDetail, StoreSettings, InventoryLog, AnomalyTicket } = models;

    const t = await sequelizeInstance.transaction();

    try {
        const summary = {};

        // STEP 1: InventoryLogs — hapus semua log inventory milik toko ini
        summary.inventoryLogs = await InventoryLog.destroy({
            where: { user_id_fk: storeOwnerId },
            force: true, // hard delete, bukan soft delete
            transaction: t
        });

        // STEP 2: AnomalyTickets — hapus semua tiket anomali milik toko ini
        summary.anomalyTickets = await AnomalyTicket.destroy({
            where: { user_id_fk: storeOwnerId },
            force: true,
            transaction: t
        });

        // STEP 3: TransactionDetails — ambil semua transaction_id milik toko ini dulu
        // lalu hapus detail berdasarkan transaction_id_fk agar tidak perlu JOIN kompleks
        const txIds = await Transaction.findAll({
            where: { user_id_fk: storeOwnerId },
            attributes: ['transaction_id'],
            raw: true,
            transaction: t
        });
        const transactionIdList = txIds.map(tx => tx.transaction_id);

        if (transactionIdList.length > 0) {
            const { Op } = require('sequelize');
            summary.transactionDetails = await TransactionDetail.destroy({
                where: { transaction_id_fk: { [Op.in]: transactionIdList } },
                force: true,
                transaction: t
            });
        } else {
            summary.transactionDetails = 0;
        }

        // STEP 4: Transactions — hapus semua transaksi header milik toko ini
        summary.transactions = await Transaction.destroy({
            where: { user_id_fk: storeOwnerId },
            force: true,
            transaction: t
        });

        // STEP 5: StoreSettings — hapus pengaturan toko
        summary.storeSettings = await StoreSettings.destroy({
            where: { user_id_fk: storeOwnerId },
            force: true,
            transaction: t
        });

        // STEP 6: Products — hapus semua produk milik toko ini (hard delete, lewati soft-delete)
        summary.products = await Product.destroy({
            where: { user_id_fk: storeOwnerId },
            force: true,
            transaction: t
        });

        // STEP 7: Karyawan — hapus semua user karyawan yang owner_id-nya adalah storeOwnerId
        summary.employees = await User.destroy({
            where: { owner_id: storeOwnerId },
            force: true,
            transaction: t
        });

        // STEP 8: Owner User — hapus user Owner terakhir
        summary.ownerUser = await User.destroy({
            where: { user_id: storeOwnerId },
            force: true,
            transaction: t
        });

        await t.commit();

        return {
            success: true,
            purgedAt: new Date().toISOString(),
            summary // { inventoryLogs: N, transactions: N, ... }
        };

    } catch (err) {
        await t.rollback();
        // Re-throw agar controller bisa menangkap dan return 500
        throw new Error(`Hard purge gagal dan di-rollback: ${err.message}`);
    }
};

module.exports = { hardPurgeStore };
