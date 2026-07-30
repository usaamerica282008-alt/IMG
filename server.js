const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DB_FILE = path.join(__dirname, 'database.json');

// Database JSON keessaa dubbisuu fi uumuu
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = { users: [], recharges: [], withdrawals: [], tasks: ["Video 1", "Video 2", "Video 3", "Video 4", "Video 5"] };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 1. REGISTRATION API
app.post('/api/register', (req, res) => {
    const { phoneNumber, password, confirmPassword } = req.body;
    if (password !== confirmPassword) return res.send("<script>alert('Password wal hin fakkaatu!'); window.location='/';</script>");

    let db = readDB();
    if (db.users.find(u => u.phoneNumber === phoneNumber)) return res.send("<script>alert('Lakkoofsi kun duraan jira!'); window.location='/';</script>");

    let newUser = {
        id: Date.now().toString(),
        phoneNumber,
        password,
        vipLevel: 0,
        balance: 0,
        todayEarnings: 0,
        referralCode: 'REF' + Math.floor(1000 + Math.random() * 9000)
    };

    db.users.push(newUser);
    writeDB(db);
    res.send("<script>alert('Milkiidhaan galmaayeera! Amma Login godhadhu.'); window.location='/';</script>");
});

// 2. LOGIN API
app.post('/api/login', (req, res) => {
    const { phoneNumber, password } = req.body;
    let db = readDB();
    
    // Admin Login Check
    if (phoneNumber === "admin" && password === "admin123") {
        return res.redirect('/admin-panel');
    }

    let user = db.users.find(u => u.phoneNumber === phoneNumber && u.password === password);
    if (!user) return res.send("<script>alert('Lakkoofsa ykn password sirrii miti!'); window.location='/';</script>");
    
    res.redirect(`/dashboard?userId=${user.id}`);
});

// 3. ADMIN: APPROVE RECHARGE
app.post('/api/admin/approve-recharge', (req, res) => {
    const { userId, amount } = req.body;
    let db = readDB();
    let user = db.users.find(u => u.id === userId);
    if (user) {
        user.balance += Number(amount);
        db.recharges.push({ userId, amount, date: new Date() });
        writeDB(db);
    }
    res.redirect('/admin-panel');
});

// ================= VISUAL INTERFACES (HTML/UI) =================

// A. LOGIN & REGISTER SCREEN (Home)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Telebirr App - Login</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; display: flex; justify-content: center; }
            .box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); width: 100%; max-width: 350px; margin-bottom: 20px; }
            h2 { text-align: center; color: #333; }
            input { width: 92%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px; }
            button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
        </style>
    </head>
    <body>
        <div>
            <div class="box">
                <h2>Login Panel</h2>
                <form action="/api/login" method="POST">
                    <input type="text" name="phoneNumber" placeholder="Phone Number (ykn 'admin')" required>
                    <input type="password" name="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                </form>
            </div>
            <div class="box">
                <h2>Registration</h2>
                <form action="/api/register" method="POST">
                    <input type="number" name="phoneNumber" placeholder="Phone Number" required>
                    <input type="password" name="password" placeholder="Password" required>
                    <input type="password" name="confirmPassword" placeholder="Confirm Password" required>
                    <button type="submit" style="background: #28a745;">Register</button>
                </form>
            </div>
        </div>
    </body>
    </html>
    `);
});

// B. USER DASHBOARD PANEL
app.get('/dashboard', (req, res) => {
    const userId = req.query.userId;
    let db = readDB();
    let user = db.users.find(u => u.id === userId);
    if (!user) return res.send("User not found");

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f0f2f5; padding: 15px; }
            .card { background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
            h3 { margin-top: 0; color: #0056b3; }
            .btn { background: #007bff; color: white; padding: 8px 12px; border: none; border-radius: 5px; text-decoration: none; display: inline-block; font-size: 14px; }
        </style>
    </head>
    <body>
        <h2>Dashboard Panel (Abu Eyew)</h2>
        
        <div class="card">
            <h3>⚡ Recharge Account</h3>
            <p>Name: Abu Eyew</p>
            <p>Telebirr: 0934286256</p>
            <p><strong>Transaction ID fi Receipt Upload asitti godhi.</strong></p>
        </div>

        <div class="card">
            <h3>💰 Personal Wallet</h3>
            <p>Today Earning: ${user.todayEarnings} ETB</p>
            <p>Current Balance: <b>${user.balance} ETB</b></p>
        </div>

        <div class="card">
            <h3>📋 Task (5 Videos)</h3>
            <p>VIP 0 = 5 x 15 ETB (Trainee Member)</p>
            <ul>${db.tasks.map(t => `<li>${t} - <a href="#">Daawwadhu</a></li>`).join('')}</ul>
            <p style="color: red; font-size: 12px;">Sunday is rest day so task is no assigned</p>
        </div>

        <div class="card">
            <h3>🏧 Withdrawal</h3>
            <p>Limits: 500, 1500, 4500, 12000 ETB</p>
            <p style="color: gray; font-size: 12px;">Time: Monday - Friday (9:00 AM - 5:30 PM)</p>
        </div>

        <a href="/" class="btn" style="background: #dc3545;">Log Out</a>
    </body>
    </html>
    `);
});

// C. ADMIN CONTROL PANEL SCREEN
app.get('/admin-panel', (req, res) => {
    let db = readDB();
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Panel</title>
        <style>
            body { font-family: Arial, sans-serif; background: #fff3f3; padding: 15px; }
            .card { background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 5px solid red; }
            input, select { padding: 8px; margin: 5px 0; width: 90%; }
            button { background: red; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h2 style="color: red;">⚙️ Admin Control Panel</h2>
        
        <div class="card">
            <h3>All User Information (Member List)</h3>
            <table border="1" cellpadding="5" style="width:100%; border-collapse: collapse;">
                <tr><th>Phone</th><th>Balance</th><th>VIP</th><th>ID</th></tr>
                ${db.users.map(u => `<tr><td>${u.phoneNumber}</td><td>${u.balance} ETB</td><td>VIP ${u.vipLevel}</td><td>${u.id}</td></tr>`).join('')}
            </table>
        </div>

        <div class="card">
            <h3>Recharge (Approve & Reject)</h3>
            <form action="/api/admin/approve-recharge" method="POST">
                <input type="text" name="userId" placeholder="User ID Galchi" required><br>
                <input type="number" name="amount" placeholder="Amount (ETB)" required><br>
                <button type="submit" style="background: #28a745;">Approve Recharge</button>
            </form>
        </div>

        <div class="card">
            <h3>VIP (Open & Close)</h3>
            <p>VIP 1 hanga 10 asitti banama ykn cufama.</p>
            <button type="button">VIP 1 Cufi</button> <button type="button" style="background:#28a745;">VIP 1 Bani</button>
        </div>

        <a href="/" style="color: blue; font-weight: bold; text-decoration: none;">← Gara Login Deebi'i</a>
    </body>
    </html>
    `);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Appiin kee faayila tokkoon port ${PORT} irratti ka'eera!`));
