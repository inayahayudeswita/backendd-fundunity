const express = require('express');
const router = express.Router();
const { createTransaction } = require('../services/paymentServices'); // Pastikan nama file dan path benar

router.post('/v1/donation', async (req, res) => {
  try {
    const { name, email, amount } = req.body;

    // Log request body untuk debug
    console.log('Received donation request:', { name, email, amount });

    if (!name || !email || !amount) {
      console.log('Validation error: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await createTransaction({ name, email, amount });

    // Log response dari Midtrans
    console.log('Transaction created. Snap token:', response.token);

    res.json({ snapToken: response.token });
  } catch (error) {
    // Log error detail
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

module.exports = router;
