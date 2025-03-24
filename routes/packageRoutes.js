//package
const express = require('express');
const { getPackages } = require('../controllers/packageController.js');

const router = express.Router();

router.get('/', getPackages);

module.exports = router;