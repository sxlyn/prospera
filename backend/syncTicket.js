const { sequelize, AnomalyTicket } = require('./models');

async function syncDB() {
    try {
        await AnomalyTicket.sync({ alter: true });
        console.log("Anomaly_Tickets table synced successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Failed to sync:", err);
        process.exit(1);
    }
}

syncDB();
