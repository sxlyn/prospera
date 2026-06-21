const cron = require('node-cron');
const { runSync } = require('../scripts/syncAI');

const startCronJobs = () => {
    // Jalankan setiap jam 02:00 pagi (WIB)
    // 0 2 * * * = "Pada menit ke-0 lewat jam 2 pagi setiap hari"
    cron.schedule('0 2 * * *', async () => {
        console.log('[CRON] Menjalankan Nightly AI Restock Sync...');
        try {
            await runSync();
            console.log('[CRON] Nightly AI Restock Sync selesai.');
        } catch (error) {
            console.error('[CRON] Nightly AI Restock Sync gagal:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Jakarta" // Mencegah Timezone Trap dari Cloud Server UTC
    });

    console.log('[CRON] Background Jobs (Nightly Sync) telah diinisialisasi (Timezone: Asia/Jakarta).');
};

module.exports = { startCronJobs };
