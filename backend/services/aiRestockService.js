const { TransactionDetail, Transaction } = require('../models');
const { Op, fn, col } = require('sequelize');

/**
 * Enterprise AI Restock Engine
 * Menghitung saran restock berdasarkan Reorder Point (ROP), Pipeline Inventory,
 * New Product Deflation, dan Soft-Delete check secara terpusat (Single Source of Truth).
 */
const calculateRestockForProducts = async (userId, productIds, productDataMap) => {
    if (!productIds || productIds.length === 0) {
        return {};
    }

    // 1. Sub-query Absolute 30-Day Velocity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const velocityData = await TransactionDetail.findAll({
        attributes: [
            "product_id_fk",
            [fn("SUM", col("quantity")), "absolute_30d_sold"]
        ],
        include: [
            {
                model: Transaction,
                attributes: [],
                where: {
                    user_id_fk: userId,
                    status: 'success',
                    transaction_datetime: { [Op.gte]: thirtyDaysAgo }
                }
            }
        ],
        where: {
            transaction_type: 'sell',
            product_id_fk: { [Op.in]: productIds }
        },
        group: ["product_id_fk"],
        raw: true
    });

    const velocityMap = {};
    velocityData.forEach(v => {
        velocityMap[v.product_id_fk] = parseInt(v.absolute_30d_sold) || 0;
    });

    // 2. Sub-query Pipeline Inventory (Stock on Order)
    const pipelineData = await TransactionDetail.findAll({
        attributes: [
            "product_id_fk",
            [fn("SUM", col("quantity")), "stock_on_order"]
        ],
        include: [
            {
                model: Transaction,
                attributes: [],
                where: {
                    user_id_fk: userId,
                    status: 'pending'
                }
            }
        ],
        where: {
            transaction_type: 'buy',
            product_id_fk: { [Op.in]: productIds }
        },
        group: ["product_id_fk"],
        raw: true
    });

    const pipelineMap = {};
    pipelineData.forEach(p => {
        pipelineMap[p.product_id_fk] = parseInt(p.stock_on_order) || 0;
    });

    // 3. Konstanta Supply Chain
    const LEAD_TIME_DAYS = 7;
    const SAFETY_STOCK_DAYS = 14;
    const TARGET_STOCK_DAYS = 30;
    
    const suggestions = {};
    
    productIds.forEach(productId => {
        const product = productDataMap[productId];
        if (!product) return;
        
        const currentStock = parseInt(product.product_stock) || 0;
        const stockOnOrder = pipelineMap[productId] || 0;
        const isDeleted = product.deletedAt !== null && product.deletedAt !== undefined;
        const createdAt = new Date(product.createdAt);
        
        // Deflation & Zero-Day fix
        const daysSinceCreated = Math.max(1, Math.ceil((new Date() - createdAt) / (1000 * 60 * 60 * 24)));
        const validDays = Math.min(30, daysSinceCreated);

        const absoluteSold = velocityMap[productId] || 0;
        const dailyVelocity = absoluteSold / validDays;

        const minDisplayQty = parseInt(product.min_display_qty) || 5;

        const safetyStock = dailyVelocity * SAFETY_STOCK_DAYS;
        const aiReorderPoint = Math.ceil((dailyVelocity * LEAD_TIME_DAYS) + safetyStock);
        const finalReorderPoint = Math.max(aiReorderPoint, minDisplayQty);

        let suggestion = 0;

        // Hybrid Logic: Cek terhadap finalReorderPoint, bukan cuma pure AI
        if (!isDeleted && currentStock <= finalReorderPoint) {
            const aiTargetStock = Math.ceil(dailyVelocity * TARGET_STOCK_DAYS);
            const displayTargetStock = minDisplayQty * 2; // Default facing target
            const finalTargetStock = Math.max(aiTargetStock, displayTargetStock);
            suggestion = Math.ceil(finalTargetStock - (currentStock + stockOnOrder));
        }

        if (suggestion < 0) suggestion = 0;
        
        suggestions[productId] = {
            suggested_restock: suggestion,
            stock_on_order: stockOnOrder,
            velocity: dailyVelocity,
            calculated_reorder_point: aiReorderPoint
        };
    });
    
    return suggestions;
};

const syncProductAI = async (productId) => {
    try {
        const { Product } = require('../models');
        const product = await Product.findByPk(productId, { paranoid: false });
        if (!product) return;
        
        const userId = product.user_id_fk;
        const productDataMap = {
            [productId]: {
                product_stock: product.product_stock,
                createdAt: product.createdAt,
                deletedAt: product.deletedAt,
                min_display_qty: product.min_display_qty
            }
        };
        
        const suggestions = await calculateRestockForProducts(userId, [productId], productDataMap);
        const data = suggestions[productId];
        
        if (data && data.calculated_reorder_point !== undefined) {
            await product.update({ calculated_reorder_point: data.calculated_reorder_point });
        }
    } catch (err) {
        console.error("Failed to sync AI ROP for product", productId, err);
    }
};

module.exports = {
    calculateRestockForProducts,
    syncProductAI
};
