const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Initialize tables
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT,
                phone TEXT,
                address TEXT,
                total_amount REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                item_id INTEGER,
                item_name TEXT,
                price REAL,
                quantity INTEGER,
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT,
                date TEXT,
                time TEXT,
                guests INTEGER,
                phone TEXT,
                requests TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            
            console.log('Database tables initialized.');
        });
    }
});

module.exports = db;
