const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Create MySQL connection
const connection = mysql.createConnection({
    // host: 'localhost',
    // user: 'root',
    // password: '',
    // database: 'c237_gamingitemapp'
    host: 'db4free.net',
    user: 'aarvalan',
    password: 'aarvalan69',
    database: 'c237gamingitem'
});

const getItemFromDatabase = (itemId, callback) => {
    const sql = 'SELECT * FROM items WHERE itemId = ?';
    connection.query(sql, [itemId], (error, results) => {
        if (error) {
            return callback(error, null);
        }
        if (results.length > 0) {
            return callback(null, results[0]);
        }
        return callback(new Error('Item not found'), null);
    });
};

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');

// enable static files
app.use(express.static('public'));

// enable from processing
app.use(express.urlencoded({
    extended: false
}));

// Define routes
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM items';
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    //Fetch data from mySQL
    connection.query( sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving items')
        }
        connection.query( login, [userId], (error, l_results) => {
            if (error) {
                console.error('Database query error:', error.message);
                return res.status(500).send('Error retrieving login status')
            }
        //Render HTML page with data
            res.render('index', { items:results, login: l_results });
        });
    });
});

app.get('/pricerange', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    const { min, max } = req.query;
    const sql = 'SELECT * FROM items WHERE price BETWEEN ? AND ?';
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        connection.query(sql, [min, max], (error, results) => {
            if (error) {
                console.error('Database query error:', error.message);
                return res.status(500).send('Error retrieving items');
            }
            res.render('index', { items: results, login: l_results});
        });
    });
});

app.get('/login', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        res.render('login', { login: l_results });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sqlCheckUser = 'SELECT userId FROM users WHERE username = ? AND user_password = ?';
    const sqlUpdateStatus = 'UPDATE users SET login_status = 1 WHERE userId = ?';

    connection.query(sqlCheckUser, [username, password], (err, results) => {
        if (err) {
            console.error('Database query error:', err.message);
            return res.status(500).send('Error logging in');
        }

        if (results.length > 0) {
            const userId = results[0].userId;

            connection.query(sqlUpdateStatus, [userId], (err, results) => {
                if (err) {
                    console.error('Database query error:', err.message);
                    return res.status(500).send('Error updating login status');
                } else {
                    res.redirect('/');
                }
            });
        } else {
            res.status(401).send('Invalid username or password');
            res.redirect('/login');
        }
    });
});

app.get('/logout', (req, res) => {
    const sql = 'UPDATE users SET login_status = 0 WHERE userId = ?';
    const userId = 1;
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        connection.query(sql, [userId], (err, results) => {
            if (err) {
                console.error('Database query error:', err.message);
                return res.status(500).send('Error logging out');
            }
            res.redirect('/');
        });
    });
});

app.get('/search', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    const { query } = req.query;
    const sql = 'SELECT * FROM items WHERE name LIKE ?';
    const searchItem = `%${query}%`;
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        connection.query(sql, [searchItem, searchItem, searchItem], (error, results) => {
            if (error) {
                console.error('Database query error:', error.message);
                return res.status(500).send('Error retrieving items');
            }
            res.render('index', { items: results, searchItem: query, login: l_results});
        });
    });
});

app.get('/item/:id', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    const itemId = req.params.id;

    // Validate item ID (assuming it's a number)
    if (!Number.isInteger(Number(itemId))) {
        return res.status(400).send('Invalid item ID');
    }

    const sql = 'SELECT * FROM items WHERE itemId = ?';

    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        connection.query(sql, [itemId], (error, results) => {
            if (error) {
                console.error('Database query error:', error.message);
                return res.status(500).send('Internal Server Error');
            }
    
            if (results.length > 0) {
                res.render('item', { item: results[0], login: l_results });
            } else {
                res.status(404).send('Item not found');
            }
        });
    });
});


app.get('/addItem', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        res.render('addItem', { login: l_results });
    });
});

app.post('/addItem', upload.single('image'), (req, res) => {
    // Extract item data from the request body
    const { name,i_description, quantity, price} = req.body;
    let image;
    if (req.file) {
        image = req.file.filename; //Save only the filename
    } else {
        image = null;
    }

    const sql = 'INSERT INTO items (name, i_description, quantity, price, image) VALUES (?, ?, ?, ?, ?)';
    //Insert the new item into the database
    connection.query( sql , [name, i_description, quantity, price, image], (error, results) => {
        if (error) {
            // Handle any errors that occur during the database operation
            console.error('Error adding item:', error);
            res.status(500).send('Error adding item');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

app.get('/editItem/:id', (req,res) => {
    const itemId = req.params.id;
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    const sql = 'SELECT * FROM items WHERE itemId = ?';
    // Fetch data from MySQL based on the item ID
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        };
        connection.query( sql , [itemId], (error, results) => {
            if (error) {
                console.error('Database query error:', error.message);
                return res.status(500).send('Error retrieving item by ID');
            }
            // Check if any item with the given ID was found
            if (results.length > 0) {
                // Render HTML page with the item data
                res.render('editItem', { items: results[0], login: l_results });
            } else {
                // If no item with the given ID was found, render a 404 page or handle it accordingly
                res.status(404).send('Item not found');
            }
        });
    });
});

app.post('/editItem/:id', upload.single('image'), (req, res) => {
    const itemId = req.params.id;
    // Extract item data from the request body
    const { name,i_description, quantity, price } = req.body;
    let image = req.body.currentImage; //retrieve current image filename
    if (req.file) {
        image = req.file.filename; // set image to be new image filename
    }
 
    const sql = 'UPDATE items SET name = ?, i_description = ? , quantity = ?, price = ?, image =? WHERE itemId = ?';
 
    // Insert the new item into the database
    connection.query( sql , [name, i_description, quantity, price, image, itemId], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error updating item:", error);
            res.status(500).send('Error updating item');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

app.get('/deleteItem/:id', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    const itemId = req.params.id;
    const sql = 'DELETE FROM items WHERE itemId = ?';
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        };
        connection.query( sql , [itemId], (error, results) => {
            if (error) {
                // Handle any error that occurs during the database operation
                console.error("Error deleting item:", error);
                res.status(500).send('Error deleting item');
            } else {
                // Send a success response
                res.redirect('/');
            }
        });
    });
});

app.get('/checkout', (req, res) => {
    const sql = 'SELECT * FROM cartitems';
    const total = 'SELECT SUM(quantity * price) AS total FROM cartitems;';
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        connection.query( sql, (error, results) => {
            if (error) {
                console.error('Database query error:', error.message);
                return res.status(500).send('Error retrieving items');
            }
            connection.query( total, (error, total) => {
                if (error) {
                    console.error('Database query error:', error.message);
                    return res.status(500).send('Error retrieving items');
                }
                res.render('checkout', { items: results, total: total[0].total, login: l_results});
            });
        });
    });
});

app.get('/cart', (req, res) => {
    const sql = 'SELECT * FROM cartitems';
    const total = 'SELECT SUM(quantity * price) AS total FROM cartitems';
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        connection.query( sql, (error, results) => {
            if (error) {
                console.error('Database query error:', error.message);
                return res.status(500).send('Error retrieving items');
            }
            connection.query( total, (error, total) => {
                if (error) {
                    console.error('Database query error:', error.message);
                    return res.status(500).send('Error retrieving items');
                }
                res.render('cart', { items: results, total: total[0].total, login: l_results });
            });
        });
    });
});

app.get('/addCart/:itemId', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    const { itemId } = req.params;
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        getItemFromDatabase(itemId, (error, item) => {
            if (error) {
                console.error('Error getting item details:', error.message);
                return res.status(500).send('Error getting item details');
            }
            res.render('addCart', { item, login: l_results});
        });
    });
});

// Add to cart
app.post('/addCart/:itemId', (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;

    getItemFromDatabase(itemId, (error, item) => {
        if (error) {
            console.error('Error getting item details:', error.message);
            return res.status(500).send('Error getting item details');
        }

        const sqlCheck = 'SELECT * FROM cartitems WHERE cartId = ?';
        connection.query(sqlCheck, [itemId], (err, results) => {
            if (err) {
                console.error('Error checking cart:', err.message);
                return res.status(500).send('Error checking cart');
            }

            if (results.length > 0) {
                // Item exists in cart, update quantity
                const newQuantity = results[0].quantity + parseInt(quantity, 10);
                const sqlUpdate = 'UPDATE cartitems SET quantity = ? WHERE cartId = ?';
                connection.query(sqlUpdate, [newQuantity, itemId], (err, updateResults) => {
                    if (err) {
                        console.error('Error updating cart item:', err.message);
                        return res.status(500).send('Error updating cart item');
                    }
                    console.log('Cart item updated successfully.');
                    res.redirect('/cart');
                });
            } else {
                // Item not in cart, insert new record
                const sqlInsert = 'INSERT INTO cartitems (cartId, name, quantity, price, image) VALUES (?, ?, ?, ?, ?)';
                const values = [itemId, item.name, quantity, item.price, item.image];
                connection.query(sqlInsert, values, (err, insertResults) => {
                    if (err) {
                        console.error('Error adding item to cart:', err.message);
                        return res.status(500).send('Error adding item to cart');
                    }
                    console.log('Item added to cart.');
                    res.redirect('/cart');
                });
            }
        });
    });
});

app.get('/updateCart/:cartId', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    const { cartId } = req.params;
    const sql = 'SELECT * FROM cartitems WHERE cartId = ?';
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        connection.query(sql, [cartId], (err, results) => {
            if (err) {
                console.error('Error getting cart item:', err.message);
                return res.status(500).send('Error getting cart item');
            }
            if (results.length > 0) {
                res.render('editCartItem', { item: results[0], login: l_results });
            } else {
                res.status(404).send('Cart item not found');
            }
        });
    });
});

app.post('/updateCart/:cartId', (req, res) => {
    const { cartId } = req.params; 
    const { quantity } = req.body;

    const sql = 'UPDATE cartitems SET quantity = ? WHERE cartId = ?';

    connection.query(sql, [quantity, cartId], (err, result) => {
        if (err) {
            console.error('Error updating cart item:', err.message);
            return res.status(500).send('Error updating cart item');
        }
        console.log('Cart item updated successfully.');
        res.redirect('/cart'); // Redirect to cart page after updating
    });
});

app.get('/deleteCart/:id', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    const itemId = req.params.id;
    const sql = 'DELETE FROM cartitems WHERE cartId = ?';
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        connection.query( sql , [itemId], (error, results) => {
            if (error) {
                console.error("Error deleting item:", error);
                res.status(500).send('Error deleting item');
            } else {
                res.redirect('/cart');
            }
        });
    });
});

app.get('/payment', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        res.render('payment', { login: l_results });
    });
});

app.post('/payment', (req, res) => {
    const sql = 'DELETE FROM cartitems';

    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error deleting cart items');
        }

        console.log(`Deleted ${results.affectedRows} cart items`);
        res.redirect('/thanks');
    });
});

app.get('/contact', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        res.render('contact', { login: l_results });
    });
});

app.get('/thanks', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        res.render('thankYou', { login: l_results });
    });
});

app.get('/aboutUs', (req, res) => {
    const login = 'SELECT login_status FROM users WHERE userId = ?;';
    const userId = 1;
    connection.query( login, [userId], (error, l_results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving login status')
        }
        res.render('aboutUs', { login: l_results });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));