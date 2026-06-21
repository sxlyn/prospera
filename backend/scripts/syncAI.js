const { Product } = require('../models');
const { syncProductAI } = require('../services/aiRestockService');

async function runSync() {
    console.log("Memulai proses sinkronisasi AI Restock (Cold Start Prevention)...");
    
    try {
        const products = await Product.findAll({
            attributes: ['product_id'],
            paranoid: false // Ikutkan produk yang di soft-delete kalau perlu
        });
        
        console.log(`Ditemukan ${products.length} produk. Memulai kalkulasi...`);
        
        for (let i = 0; i < products.length; i++) {
            const pid = products[i].product_id;
            await syncProductAI(pid);
            if ((i + 1) % 10 === 0) {
                console.log(`Progres: ${i + 1} / ${products.length}`);
            }
        }
        
        console.log("Sinkronisasi AI ROP berhasil diselesaikan 100%.");
    } catch (err) {
        console.error("Gagal melakukan sinkronisasi:", err);
    }
}

// Jika dijalankan secara langsung dari CLI (node syncAI.js)
if (require.main === module) {
    runSync().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runSync };
