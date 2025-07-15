const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const UserModel = require("./model/User");
const QRCodeModel = require("./model/QRCode");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Replace with your frontend's URL
    credentials: true
}));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    }),
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

app.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserModel({ name, email, password: hashedPassword, role });
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
                res.json("Success");
            } else {
                res.status(401).json("Password doesn't match");
            }
        } else {
            res.status(404).json("No Records found");
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/logout", (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                res.status(500).json({ error: "Failed to logout" });
            } else {
                res.status(200).json("Logout successful");
            }
        });
    } else {
        res.status(400).json({ error: "No session found" });
    }
});

app.get('/user', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json("Not authenticated");
    }
});

app.get('/check-role', (req, res) => {
    if (req.session.user) {
        res.json({ role: req.session.user.role });
    } else {
        res.status(401).json("Not authenticated");
    }
});

// Get all users (for admin)
app.get("/users", async (req, res) => {
    try {
        if (!req.session.user || !['admin', 'superadmin'].includes(req.session.user.role.toLowerCase())) {
            return res.status(403).json({ error: "Access denied" });
        }
        // Only return users (not admins or superadmins)
        const users = await UserModel.find({ role: "user" }).select('name email _id role');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Helper function to generate a unique QR code value
async function generateUniqueQRCodeValue() {
    let qrValue;
    let isUnique = false;
    while (!isUnique) {
        qrValue = '';
        for (let j = 0; j < 16; j++) {
            qrValue += Math.floor(Math.random() * 10);
        }
        const existingQR = await QRCodeModel.findOne({ qrValue });
        if (!existingQR) {
            isUnique = true;
        }
    }
    return qrValue;
}

function requireSuperAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Super Admin role required.' });
    }
    next();
}

// Only superadmin can generate QR codes
app.post("/generate-qrcodes", requireSuperAdmin, async (req, res) => {
    try {
        // 2. Input Validation
        const { count, userId } = req.body;
        if (!count || count <= 0) {
            return res.status(400).json({ error: "A valid count must be provided." });
        }
        if (!userId) {
            return res.status(400).json({ error: "A user selection must be made." });
        }

        console.log(`[SuperAdmin] Attempting to generate ${count} QR code(s) for selection: ${userId}`);

        // Handle unassigned QR codes
        if (userId === 'none') {
            const generatedCodeIds = [];
            for (let i = 0; i < count; i++) {
                const qrValue = await generateUniqueQRCodeValue();
                const newQRCode = new QRCodeModel({
                    qrValue
                    // No createdBy field
                });
                await newQRCode.save();
                generatedCodeIds.push(newQRCode._id);
            }
            const populatedCodes = await QRCodeModel.find({ 
                _id: { $in: generatedCodeIds } 
            });
            return res.status(201).json({ 
                codes: populatedCodes, 
                userCount: 0
            });
        }

        let usersToProcess = [];

        // 3. Determine which users to process
        if (userId === 'all') {
            // Use case-insensitive regex to find all users with the 'user' role.
            usersToProcess = await UserModel.find({ role: /^user$/i });
            console.log(`[SuperAdmin] Found ${usersToProcess.length} users to process for 'All Users'.`);
        } else {
            // Find the single selected user.
            const singleUser = await UserModel.findById(userId);
            if (singleUser) {
                usersToProcess.push(singleUser);
            }
            console.log(`[SuperAdmin] Found ${usersToProcess.length} user(s) to process for single selection.`);
        }

        if (usersToProcess.length === 0) {
            return res.status(404).json({ error: "No valid users found for the given selection." });
        }

        const generatedCodeIds = [];
        let totalGenerated = 0;

        // 4. Generate and Save QR Codes
        for (const user of usersToProcess) {
            for (let i = 0; i < count; i++) {
                const qrValue = await generateUniqueQRCodeValue();
                const newQRCode = new QRCodeModel({
                    qrValue,
                    createdBy: user._id  // Ensure correct field name from schema
                });
                await newQRCode.save();
                generatedCodeIds.push(newQRCode._id);
                totalGenerated++;
            }
        }
        
        if (totalGenerated === 0) {
            return res.status(500).json({ error: "No QR codes were generated. Please check your input and try again." });
        }

        console.log(`[SuperAdmin] Successfully saved ${generatedCodeIds.length} new QR codes to the database.`);

        // 5. Respond with populated data
        const populatedCodes = await QRCodeModel.find({ 
            _id: { $in: generatedCodeIds } 
        }).populate('createdBy', 'name email');
        
        console.log(`[SuperAdmin] Responding with ${populatedCodes.length} populated QR codes.`);

        res.status(201).json({ 
            codes: populatedCodes, 
            userCount: usersToProcess.length 
        });

    } catch (error) {
        console.error("[SuperAdmin] CRITICAL ERROR generating QR codes:", error);
        res.status(500).json({ error: "Failed to generate QR codes due to a server error. " + error.message });
    }
});

// Get all QR codes (for admin and superadmin)
app.get("/qrcodes", async (req, res) => {
    try {
        if (!req.session.user || !['admin', 'superadmin'].includes(req.session.user.role.toLowerCase())) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Return all QR codes, not just active
        const qrCodes = await QRCodeModel.find({})
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(qrCodes);
    } catch (error) {
        console.error("Error fetching QR codes:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get QR codes for specific user
app.get("/user-qrcodes", async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const userId = req.session.user.id;

        let userObjectId;
        try {
            userObjectId = new mongoose.Types.ObjectId(userId);
        } catch (e) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const qrCodes = await QRCodeModel.find({
            createdBy: userObjectId,
            isActive: true
        }).sort({ createdAt: -1 });

        res.json(qrCodes);

    } catch (error) {
        console.error(`[User QR] CRITICAL ERROR fetching codes for User ID: ${req.session?.user?.id}. Error:`, error);
        res.status(500).json({ error: "A server error occurred while fetching QR codes." });
    }
});

// Update QR code
app.put("/qrcodes/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const { qrValue, createdBy } = req.body;
        const qrCodeId = req.params.id;

        // Check if QR code exists and user has permission
        const qrCode = await QRCodeModel.findById(qrCodeId);
        if (!qrCode) {
            return res.status(404).json({ error: "QR code not found" });
        }

        if (qrCode.createdBy && qrCode.createdBy.toString() !== req.session.user.id && req.session.user.role.toLowerCase() !== 'admin' && req.session.user.role.toLowerCase() !== 'superadmin') {
            return res.status(403).json({ error: "Access denied" });
        }

        // Check if new QR value is unique
        if (typeof qrValue !== 'undefined' && qrValue !== qrCode.qrValue) {
            const existingQR = await QRCodeModel.findOne({ qrValue });
            if (existingQR) {
                return res.status(400).json({ error: "QR code value already exists" });
            }
            qrCode.qrValue = qrValue;
        }

        // Allow updating createdBy (including unassigning)
        if (typeof createdBy !== 'undefined') {
            qrCode.createdBy = createdBy === '' ? null : createdBy;
        }

        const updatedQRCode = await qrCode.save();
        res.json(updatedQRCode);
    } catch (error) {
        console.error("Error updating QR code:", error);
        res.status(500).json({ error: error.message });
    }
});

// Delete QR code (hard delete)
app.delete("/qrcodes/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const qrCodeId = req.params.id;

        // Check if QR code exists and user has permission
        const qrCode = await QRCodeModel.findById(qrCodeId);
        if (!qrCode) {
            return res.status(404).json({ error: "QR code not found" });
        }

        if (
            qrCode.createdBy &&
            qrCode.createdBy.toString() !== req.session.user.id &&
            !['admin', 'superadmin'].includes(req.session.user.role.toLowerCase())
        ) {
            return res.status(403).json({ error: "Access denied" });
        }

        await QRCodeModel.findByIdAndDelete(qrCodeId);
        res.json({ message: "QR code deleted permanently" });
    } catch (error) {
        console.error("Error deleting QR code:", error);
        res.status(500).json({ error: error.message });
    }
});

// Clear all QR codes (admin only)
app.delete("/qrcodes-all", async (req, res) => {
    try {
        if (!req.session.user || !['admin', 'superadmin'].includes(req.session.user.role.toLowerCase())) {
            return res.status(403).json({ error: "Access denied" });
        }

        const result = await QRCodeModel.deleteMany({});
        res.json({ message: `Successfully deleted ${result.deletedCount} QR codes.` });

    } catch (error) {
        console.error("Error clearing all QR codes:", error);
        res.status(500).json({ error: "Failed to clear all QR codes." });
    }
});

// Add a new user (admin or superadmin)
app.post("/add-user", async (req, res) => {
    if (!req.session.user || !['admin', 'superadmin'].includes(req.session.user.role)) {
        return res.status(403).json({ error: "Access denied." });
    }
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserModel({ name, email, password: hashedPassword, role });
        const savedUser = await newUser.save();
        res.status(201).json({ user: savedUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Edit user details (admin or superadmin)
app.put("/edit-user/:id", async (req, res) => {
    if (!req.session.user || !['admin', 'superadmin'].includes(req.session.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied." });
    }
    try {
        const { name, email, role } = req.body;
        const updatedUser = await UserModel.findByIdAndUpdate(
            req.params.id,
            { name, email, role },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a user (admin or superadmin)
app.delete("/delete-user/:id", async (req, res) => {
    if (!req.session.user || !['admin', 'superadmin'].includes(req.session.user.role)) {
        return res.status(403).json({ error: "Access denied." });
    }
    try {
        const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add an admin (superadmin only)
app.post("/add-admin", async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'superadmin') {
        return res.status(403).json({ error: "Access denied. Super Admin only." });
    }
    try {
        const { name, email, password } = req.body;
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new UserModel({ name, email, password: hashedPassword, role: 'admin' });
        const savedAdmin = await newAdmin.save();
        res.status(201).json(savedAdmin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete an admin (superadmin only)
app.delete("/delete-admin/:id", async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'superadmin') {
        return res.status(403).json({ error: "Access denied. Super Admin only." });
    }
    try {
        const adminToDelete = await UserModel.findById(req.params.id);
        if (!adminToDelete || adminToDelete.role !== 'admin') {
            return res.status(404).json({ error: "Admin not found" });
        }
        await UserModel.findByIdAndDelete(req.params.id);
        res.json({ message: "Admin deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all admins (for admin and superadmin)
app.get("/admins", async (req, res) => {
    if (!req.session.user || !['admin', 'superadmin'].includes(req.session.user.role)) {
        return res.status(403).json({ error: "Access denied." });
    }
    try {
        const admins = await UserModel.find({ role: "admin" }).select('name email _id');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch admins" });
    }
});

// Assign QR code to user (for users to add devices)
app.post("/assign-qrcode", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const { qrValue, location } = req.body;
        const userId = req.session.user.id;

        // Validate QR code format (16-digit number)
        const qrRegex = /^\d{16}$/;
        if (!qrRegex.test(qrValue)) {
            return res.status(400).json({ error: "Invalid QR code format. Must be a 16-digit number." });
        }

        // Find the QR code by value
        const qrCode = await QRCodeModel.findOne({ qrValue, isActive: true });
        if (!qrCode) {
            return res.status(404).json({ error: "QR code not found or inactive." });
        }

        // Check if QR code is already assigned to someone else
        if (qrCode.createdBy && qrCode.createdBy.toString() !== userId) {
            return res.status(409).json({ error: "This QR code is already assigned to another user." });
        }

        // Check if QR code is already assigned to this user
        if (qrCode.createdBy && qrCode.createdBy.toString() === userId) {
            return res.status(409).json({ error: "This QR code is already assigned to you." });
        }

        // Assign the QR code to the user
        qrCode.createdBy = userId;
        qrCode.assignedAt = new Date();
        if (location && location.latitude && location.longitude) {
            // Add previous location to history before updating
            if (qrCode.location && typeof qrCode.location.latitude === 'number' && typeof qrCode.location.longitude === 'number') {
                qrCode.locationHistory = qrCode.locationHistory || [];
                qrCode.locationHistory.push({
                    latitude: qrCode.location.latitude,
                    longitude: qrCode.location.longitude,
                    address: qrCode.location.address || '',
                    timestamp: new Date()
                });
            }
            qrCode.location = {
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address || '',
                timestamp: new Date() // <-- Ensure timestamp is set
            };
        }
        await qrCode.save();

        res.json({ 
            message: "QR code assigned successfully", 
            qrCode: {
                _id: qrCode._id,
                qrValue: qrCode.qrValue,
                createdAt: qrCode.createdAt
            }
        });

    } catch (error) {
        console.error("Error assigning QR code:", error);
        res.status(500).json({ error: "Failed to assign QR code. Please try again." });
    }
});

// Get QR code by ID (for map view)
app.get("/qrcode/:id", async (req, res) => {
    try {
        const id = req.params.id.trim();
        const qrCode = await QRCodeModel.findById(id);
        if (!qrCode) {
            return res.status(404).json({ error: "QR code not found" });
        }
        res.json({ qrCode });
    } catch (error) {
        console.error("Error fetching QR code:", error);
        res.status(500).json({ error: "Failed to fetch QR code" });
    }
});

// Update QR code location by qrValue (for Postman-style API)
app.post('/api/qr/:qrValue', async (req, res) => {
  try {
    const { qrValue } = req.params;
    const { lat, lng, address } = req.body;

    // Find the QR code by value
    const qrCode = await QRCodeModel.findOne({ qrValue });
    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    // Add previous location to history before updating
    if (qrCode.location && typeof qrCode.location.latitude === 'number' && typeof qrCode.location.longitude === 'number') {
      qrCode.locationHistory = qrCode.locationHistory || [];
      qrCode.locationHistory.push({
        latitude: qrCode.location.latitude,
        longitude: qrCode.location.longitude,
        address: qrCode.location.address || '',
        timestamp: new Date()
      });
    }

    // Also update the latest location for quick access
    qrCode.location = {
      latitude: lat,
      longitude: lng,
      address: address || '',
      timestamp: new Date() // <-- Ensure timestamp is set
    };

    await qrCode.save();

    res.json({ message: "QR code location updated", qrCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
