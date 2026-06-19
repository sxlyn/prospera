const { sequelize, StoreSettings, User } = require('./models');

async function test() {
    try {
        await sequelize.authenticate();
        console.log("DB terhubung.");
        
        // Cek model existensi
        const count = await StoreSettings.count();
        console.log("Store Settings Count:", count);

        const settings = await StoreSettings.create({
            user_id_fk: 1,
            open_hour: '08:00:00',
            close_hour: '22:00:00',
            grace_period_minutes: 30,
            is_overtime_active: false
        });

        console.log("Test create settings sukses!", settings.toJSON());
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

test();
