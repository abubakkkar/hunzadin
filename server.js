const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoints

// Create Reservation
app.post('/api/reservations', (req, res) => {
    const { name, email, date, time, guests, phone, requests } = req.body;
    
    if (!name || !email || !date || !time || !guests || !phone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = `INSERT INTO reservations (name, email, date, time, guests, phone, requests) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, email, date, time, guests, phone, requests];
    
    db.run(query, params, function(err) {
        if (err) {
            console.error('Error inserting reservation:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ success: true, reservationId: this.lastID });
    });
});

// Create Order (Checkout)
app.post('/api/orders', (req, res) => {
    const { customer_name, phone, address, total_amount, items } = req.body;
    
    if (!customer_name || !phone || !address || !total_amount || !items || !items.length) {
        return res.status(400).json({ error: 'Missing required order fields or items' });
    }
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const orderQuery = `INSERT INTO orders (customer_name, phone, address, total_amount) 
                            VALUES (?, ?, ?, ?)`;
        const orderParams = [customer_name, phone, address, total_amount];
        
        db.run(orderQuery, orderParams, function(err) {
            if (err) {
                console.error('Error inserting order:', err.message);
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Database error' });
            }
            
            const orderId = this.lastID;
            const stmt = db.prepare(`INSERT INTO order_items (order_id, item_id, item_name, price, quantity) VALUES (?, ?, ?, ?, ?)`);
            
            for (const item of items) {
                stmt.run([orderId, item.id, item.name, item.price, item.qty]);
            }
            
            stmt.finalize((err) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Error inserting order items' });
                }
                
                db.run('COMMIT', (commitErr) => {
                    if (commitErr) {
                        return res.status(500).json({ error: 'Database transaction error' });
                    }
                    res.status(201).json({ success: true, orderId });
                });
            });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
