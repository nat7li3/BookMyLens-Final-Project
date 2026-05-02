const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'FootballGrim56@',
    database: 'software_engineering'
});

db.connect(err => {
    if (err) { console.error("DB connection error:", err); return; }
    console.log("Connected to MySQL");
});

// ======================== CUSTOMER ROUTES ========================
app.post('/customer/register', async (req, res) => {
    try {
        const { fname, lname, bdate, address, email, password } = req.body;
        if (!fname || !lname || !bdate || !address || !email || !password)
            return res.status(400).send("All fields required");
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO customer (fname,lname,bdate,address,email,password) VALUES (?,?,?,?,?,?)`;
        db.query(sql, [fname, lname, bdate, address, email, hashedPassword], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).send("Email already exists");
                console.error(err); return res.status(500).send("Database error");
            }
            res.send("Customer registered successfully!");
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.post('/customer/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send("Email and password required");
    db.query("SELECT * FROM customer WHERE email = ?", [email], async (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        if (results.length === 0) return res.status(400).send("Email not found");
        const match = await bcrypt.compare(password, results[0].password);
        if (!match) return res.status(400).send("Incorrect password");
        res.send(`Welcome back, ${results[0].fname}!`);
    });
});

// ======================== PHOTOGRAPHER ROUTES ========================
app.post('/photographer/register', async (req, res) => {
    try {
        const { fname, lname, address, email, password, bussiness } = req.body;
        if (!fname || !lname || !address || !email || !password || !bussiness)
            return res.status(400).send("All fields required");
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO photographer (fname,lname,address,email,password,bussiness) VALUES (?,?,?,?,?,?)`;
        db.query(sql, [fname, lname, address, email, hashedPassword, bussiness], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).send("Email already exists");
                console.error(err); return res.status(500).send("Database error");
            }
            res.send("Photographer registered successfully!");
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.post('/photographer/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send("Email and password required");
    db.query("SELECT * FROM photographer WHERE email = ?", [email], async (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        if (results.length === 0) return res.status(400).send("Email not found");
        const match = await bcrypt.compare(password, results[0].password);
        if (!match) return res.status(400).send("Incorrect password");
        res.send(`Welcome back, ${results[0].fname}!`);
    });
});

// ======================== MESSAGING ========================
app.post('/send-message', (req, res) => {
    const { sender_type, sender_email, receiver_type, receiver_email, message } = req.body;
    if (!sender_type || !sender_email || !receiver_type || !receiver_email || !message)
        return res.status(400).send("All fields required");
    const sql = `INSERT INTO messages (sender_type,sender_email,receiver_type,receiver_email,message) VALUES (?,?,?,?,?)`;
    db.query(sql, [sender_type, sender_email, receiver_type, receiver_email, message], (err) => {
        if (err) { console.error(err); return res.status(500).send("Database error"); }
        res.send("Message sent!");
    });
});

app.get('/get-messages', (req, res) => {
    const { user1_type, user1_email, user2_type, user2_email } = req.query;
    if (!user1_type || !user1_email || !user2_type || !user2_email)
        return res.status(400).send("All fields required");
    const sql = `
        SELECT * FROM messages
        WHERE (sender_type=? AND sender_email=? AND receiver_type=? AND receiver_email=?)
           OR (sender_type=? AND sender_email=? AND receiver_type=? AND receiver_email=?)
        ORDER BY timestamp ASC
    `;
    db.query(sql, [
        user1_type, user1_email, user2_type, user2_email,
        user2_type, user2_email, user1_type, user1_email
    ], (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        res.json(results);
    });
});

app.get('/conversations', (req, res) => {
    const { email, type } = req.query;
    if (!email || !type) return res.status(400).send("Email and type required");
    const sql = `
        SELECT
            other_email,
            other_type,
            MAX(timestamp) AS last_message_time,
            SUBSTRING_INDEX(GROUP_CONCAT(message ORDER BY timestamp DESC), ',', 1) AS last_message,
            MAX(COALESCE(c.fname, p.fname)) AS fname,
            MAX(COALESCE(c.lname, p.lname)) AS lname
        FROM (
            SELECT
                CASE WHEN sender_email = ? THEN receiver_email ELSE sender_email END AS other_email,
                CASE WHEN sender_email = ? THEN receiver_type ELSE sender_type END AS other_type,
                message,
                timestamp
            FROM messages
            WHERE sender_email = ? OR receiver_email = ?
        ) AS conv
        LEFT JOIN customer c ON c.email = conv.other_email
        LEFT JOIN photographer p ON p.email = conv.other_email
        GROUP BY other_email, other_type
        ORDER BY last_message_time DESC
    `;
    db.query(sql, [email, email, email, email], (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        res.json(results);
    });
});

// ======================== PACKAGES ========================
app.post('/package/create', (req, res) => {
    const { email, name, category, price, photos_included, location, description, people, addons, creator_type } = req.body;
    if (!email || !name || !category || !price || !photos_included || !location || !description || !people || !creator_type)
        return res.status(400).send("All fields required");

    db.query("SELECT email FROM customer WHERE email = ?", [email], (err, custResults) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        db.query("SELECT email FROM photographer WHERE email = ?", [email], (err, photoResults) => {
            if (err) { console.error(err); return res.status(500).send("DB error"); }
            if (custResults.length === 0 && photoResults.length === 0)
                return res.status(403).send("Must be logged in as a customer or photographer");

            db.query("SELECT category_id FROM categories WHERE name = ?", [category], (err, catResults) => {
                if (err || catResults.length === 0) return res.status(400).send("Invalid category");
                db.query("SELECT location_id FROM locations WHERE name = ?", [location], (err, locResults) => {
                    if (err || locResults.length === 0) return res.status(400).send("Invalid location");

                    const category_id = catResults[0].category_id;
                    const location_id = locResults[0].location_id;
                    const sql = `INSERT INTO packages (email, creator_type, name, category_id, price, photos_included, location_id, description, people)
                                 VALUES (?,?,?,?,?,?,?,?,?)`;

                    db.query(sql, [email, creator_type, name, category_id, price, photos_included, location_id, description, people], (err, result) => {
                        if (err) { console.error(err); return res.status(500).send("Database error"); }
                        const package_id = result.insertId;
                        if (addons && addons.length > 0) {
                            const addonSql = `INSERT INTO addons (package_id, name, price) VALUES ?`;
                            const addonValues = addons.map(a => [package_id, a.name, a.price]);
                            db.query(addonSql, [addonValues], (err) => {
                                if (err) { console.error(err); return res.status(500).send("Addon error"); }
                                res.send("Package created successfully!");
                            });
                        } else {
                            res.send("Package created successfully!");
                        }
                    });
                });
            });
        });
    });
});

app.patch('/package/:package_id/edit', (req, res) => {
    const { package_id } = req.params;
    const { email, name, category, price, photos_included, location, description, people } = req.body;
    db.query("SELECT email FROM packages WHERE package_id = ?", [package_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        if (results.length === 0) return res.status(404).send("Package not found");
        if (results[0].email !== email) return res.status(403).send("Unauthorized");
        db.query("SELECT category_id FROM categories WHERE name = ?", [category], (err, catResults) => {
            if (err || catResults.length === 0) return res.status(400).send("Invalid category");
            db.query("SELECT location_id FROM locations WHERE name = ?", [location], (err, locResults) => {
                if (err || locResults.length === 0) return res.status(400).send("Invalid location");
                const sql = `UPDATE packages SET name=?, category_id=?, price=?, photos_included=?, location_id=?, description=?, people=? WHERE package_id=?`;
                db.query(sql, [name, catResults[0].category_id, price, photos_included, locResults[0].location_id, description, people, package_id], (err) => {
                    if (err) { console.error(err); return res.status(500).send("DB error"); }
                    res.send("Package updated successfully!");
                });
            });
        });
    });
});

app.get('/packages', (req, res) => {
    const { email } = req.query;
    let sql = `
        SELECT p.package_id, p.name, p.price, p.photos_included, p.description, p.people,
               p.email, p.creator_type, p.status, p.scheduled_date,
               c.name AS category, l.name AS location
        FROM packages p
        JOIN categories c ON p.category_id = c.category_id
        JOIN locations l ON p.location_id = l.location_id
    `;
    const params = [];
    if (email) { sql += ` WHERE p.email = ?`; params.push(email); }
    db.query(sql, params, (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        res.json(results);
    });
});

app.get('/packages/browse', (req, res) => {
    const sql = `
        SELECT p.package_id, p.name, p.price, p.photos_included, p.description, p.people,
               p.email AS customer_email, p.creator_type, p.status, p.scheduled_date,
               c.name AS category, l.name AS location,
               COALESCE(cu.fname, ph.fname) AS creator_fname,
               COALESCE(cu.lname, ph.lname) AS creator_lname
        FROM packages p
        JOIN categories c ON p.category_id = c.category_id
        JOIN locations l ON p.location_id = l.location_id
        LEFT JOIN customer cu ON cu.email = p.email
        LEFT JOIN photographer ph ON ph.email = p.email
        WHERE p.status = 'open'
        ORDER BY p.package_id DESC
    `;
    db.query(sql, (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        res.json(results);
    });
});

app.patch('/package/:package_id/close', (req, res) => {
    const { package_id } = req.params;
    const { email } = req.body;
    db.query("SELECT email FROM packages WHERE package_id = ?", [package_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        if (results.length === 0) return res.status(404).send("Package not found");
        if (results[0].email !== email) return res.status(403).send("Unauthorized");
        db.query("UPDATE packages SET status = 'taken' WHERE package_id = ?", [package_id], (err) => {
            if (err) { console.error(err); return res.status(500).send("DB error"); }
            res.send("Package marked as taken!");
        });
    });
});

app.post('/package/save-copy', (req, res) => {
    const { email, creator_type, package_id } = req.body;
    if (!email || !creator_type || !package_id) return res.status(400).send("All fields required");
    db.query("SELECT * FROM packages WHERE package_id = ?", [package_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        if (results.length === 0) return res.status(404).send("Package not found");
        const p = results[0];
        const sql = `INSERT INTO saved_packages (original_package_id, email, creator_type, name, category_id, price, photos_included, location_id, description, people)
                     VALUES (?,?,?,?,?,?,?,?,?,?)`;
        db.query(sql, [package_id, email, creator_type, p.name, p.category_id, p.price, p.photos_included, p.location_id, p.description, p.people], (err) => {
            if (err) { console.error(err); return res.status(500).send("DB error"); }
            res.send("Package saved successfully!");
        });
    });
});

app.get('/packages/saved', (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).send("Email required");
    const sql = `
        SELECT sp.save_id, sp.name, sp.price, sp.photos_included, sp.description, sp.people,
               sp.email, sp.creator_type, sp.status, sp.original_package_id,
               c.name AS category, l.name AS location
        FROM saved_packages sp
        JOIN categories c ON sp.category_id = c.category_id
        JOIN locations l ON sp.location_id = l.location_id
        WHERE sp.email = ?
    `;
    db.query(sql, [email], (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        res.json(results);
    });
});

app.patch('/package/saved/:save_id/edit', (req, res) => {
    const { save_id } = req.params;
    const { email, name, category, price, photos_included, location, description, people } = req.body;
    db.query("SELECT email FROM saved_packages WHERE save_id = ?", [save_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        if (results.length === 0) return res.status(404).send("Saved package not found");
        if (results[0].email !== email) return res.status(403).send("Unauthorized");
        db.query("SELECT category_id FROM categories WHERE name = ?", [category], (err, catResults) => {
            if (err || catResults.length === 0) return res.status(400).send("Invalid category");
            db.query("SELECT location_id FROM locations WHERE name = ?", [location], (err, locResults) => {
                if (err || locResults.length === 0) return res.status(400).send("Invalid location");
                const sql = `UPDATE saved_packages SET name=?, category_id=?, price=?, photos_included=?, location_id=?, description=?, people=? WHERE save_id=?`;
                db.query(sql, [name, catResults[0].category_id, price, photos_included, locResults[0].location_id, description, people, save_id], (err) => {
                    if (err) { console.error(err); return res.status(500).send("DB error"); }
                    res.send("Saved package updated successfully!");
                });
            });
        });
    });
});

// ======================== PROPOSALS ========================
app.post('/proposal/send', (req, res) => {
    const { conversation_key, package_id, sender_email, sender_type, receiver_email, receiver_type, new_price, new_photos, new_date } = req.body;
    if (!conversation_key || !package_id || !sender_email || !sender_type || !receiver_email || !receiver_type)
        return res.status(400).send("All fields required");
    if (!new_price && !new_photos && !new_date)
        return res.status(400).send("Must propose at least one change");

    db.query("UPDATE proposals SET status='cancelled' WHERE conversation_key=? AND status='pending'", [conversation_key], (err) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        const sql = `INSERT INTO proposals (conversation_key, package_id, sender_email, sender_type, receiver_email, receiver_type, new_price, new_photos, new_date)
                     VALUES (?,?,?,?,?,?,?,?,?)`;
        db.query(sql, [conversation_key, package_id, sender_email, sender_type, receiver_email, receiver_type, new_price || null, new_photos || null, new_date || null], (err, result) => {
            if (err) { console.error(err); return res.status(500).send("DB error"); }
            res.json({ proposal_id: result.insertId });
        });
    });
});

app.get('/proposals', (req, res) => {
    const { conversation_key } = req.query;
    if (!conversation_key) return res.status(400).send("conversation_key required");
    db.query("SELECT * FROM proposals WHERE conversation_key = ? ORDER BY timestamp ASC", [conversation_key], (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        res.json(results);
    });
});

app.patch('/proposal/:proposal_id/accept', (req, res) => {
    const { proposal_id } = req.params;
    const { email } = req.body;
    db.query("SELECT * FROM proposals WHERE proposal_id = ?", [proposal_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        if (results.length === 0) return res.status(404).send("Proposal not found");
        const proposal = results[0];
        if (proposal.receiver_email !== email) return res.status(403).send("Unauthorized");
        if (proposal.status !== 'pending') return res.status(400).send("Proposal is no longer pending");

        let updateSql = "UPDATE packages SET ";
        const updateParams = [];
        if (proposal.new_price) { updateSql += "price=?, "; updateParams.push(proposal.new_price); }
        if (proposal.new_photos) { updateSql += "photos_included=?, "; updateParams.push(proposal.new_photos); }
        if (proposal.new_date) { updateSql += "scheduled_date=?, "; updateParams.push(proposal.new_date); }

        if (updateParams.length === 0) return res.status(400).send("Nothing to update");

        updateSql = updateSql.slice(0, -2);
        updateSql += " WHERE package_id=?";
        updateParams.push(proposal.package_id);

        db.query(updateSql, updateParams, (err) => {
            if (err) { console.error(err); return res.status(500).send("DB error"); }
            db.query("UPDATE proposals SET status='accepted' WHERE proposal_id=?", [proposal_id], (err) => {
                if (err) { console.error(err); return res.status(500).send("DB error"); }
                res.send("Proposal accepted and package updated!");
            });
        });
    });
});

app.patch('/proposal/:proposal_id/reject', (req, res) => {
    const { proposal_id } = req.params;
    const { email } = req.body;
    db.query("SELECT * FROM proposals WHERE proposal_id = ?", [proposal_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        if (results.length === 0) return res.status(404).send("Proposal not found");
        if (results[0].receiver_email !== email) return res.status(403).send("Unauthorized");
        db.query("UPDATE proposals SET status='rejected' WHERE proposal_id=?", [proposal_id], (err) => {
            if (err) { console.error(err); return res.status(500).send("DB error"); }
            res.send("Proposal rejected!");
        });
    });
});

app.patch('/proposal/:proposal_id/cancel', (req, res) => {
    const { proposal_id } = req.params;
    const { email } = req.body;
    db.query("SELECT * FROM proposals WHERE proposal_id = ?", [proposal_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).send("DB error"); }
        if (results.length === 0) return res.status(404).send("Proposal not found");
        if (results[0].sender_email !== email) return res.status(403).send("Unauthorized");
        db.query("UPDATE proposals SET status='cancelled' WHERE proposal_id=?", [proposal_id], (err) => {
            if (err) { console.error(err); return res.status(500).send("DB error"); }
            res.send("Proposal cancelled!");
        });
    });
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));