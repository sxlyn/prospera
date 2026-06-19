const express = require('express');
const router = express.Router();
const storeSettingController = require('../controllers/storeSettingController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, storeSettingController.getStoreSettings);
router.put('/', verifyToken, storeSettingController.updateStoreSettings);

module.exports = router;
