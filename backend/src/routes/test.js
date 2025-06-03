const express = require('express');
const router = express.Router();

// GET /api/test
router.get('/', (req, res) => {
    res.json({
        message: 'Test route working',
        timestamp: new Date()
    });
});

// GET /api/test/ping
router.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

// POST /api/test/echo
router.post('/echo', (req, res) => {
    res.json({
        message: 'Echo endpoint',
        body: req.body,
        headers: req.headers,
        timestamp: new Date()
    });
});

module.exports = router; 