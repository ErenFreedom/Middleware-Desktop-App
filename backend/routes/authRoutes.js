const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/local-login', authController.getLocalServerToken);
router.post('/cloud-login', authController.getCloudToken);

module.exports = router;
