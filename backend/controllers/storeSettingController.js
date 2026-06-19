const { StoreSettings } = require('../models');
const bcrypt = require('bcryptjs');

exports.getStoreSettings = async (req, res) => {
    try {
        const storeId = req.user.store_id || req.user.id || req.user.user_id;
        
        if (!storeId) {
            return res.status(401).json({ message: "Sesi Anda bermasalah. Silakan logout dan login kembali." });
        }
        
        let settings = await StoreSettings.findOne({ where: { user_id_fk: storeId } });
        
        if (!settings) {
            // Berikan nilai default jika belum ada
            settings = {
                open_hour: '08:00:00',
                close_hour: '22:00:00',
                grace_period_minutes: 30,
                is_overtime_active: false
            };
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error("Error fetching store settings:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

exports.updateStoreSettings = async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: "Akses ditolak. Hanya owner yang dapat mengubah pengaturan toko." });
        }

        const ownerId = req.user.store_id || req.user.id || req.user.user_id;
        const { open_hour, close_hour, grace_period_minutes, is_overtime_active, emergency_pin } = req.body;

        let settings = await StoreSettings.findOne({ where: { user_id_fk: ownerId } });

        const updateData = {
            open_hour: open_hour || '08:00:00',
            close_hour: close_hour || '22:00:00',
            grace_period_minutes: grace_period_minutes !== undefined ? grace_period_minutes : 30,
            is_overtime_active: is_overtime_active || false,
        };

        if (emergency_pin) {
            updateData.emergency_pin = bcrypt.hashSync(emergency_pin, 10);
        }

        if (settings) {
            await settings.update(updateData);
        } else {
            updateData.user_id_fk = ownerId;
            settings = await StoreSettings.create(updateData);
        }

        res.status(200).json({ message: "Pengaturan toko berhasil diperbarui.", settings });
    } catch (error) {
        console.error("Error updating store settings:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};
