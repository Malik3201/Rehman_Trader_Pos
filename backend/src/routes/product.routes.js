const express = require('express');
const router = express.Router();

// Placeholder - should be implemented in first milestone
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Product routes placeholder' });
});

module.exports = router;
