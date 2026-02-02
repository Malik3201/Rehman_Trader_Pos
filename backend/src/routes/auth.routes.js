import express from 'express';
const router = express.Router();

// Placeholder - should be implemented in first milestone
router.get('/me', (req, res) => {
  res.json({ success: true, message: 'Auth routes placeholder' });
});

export default router;
