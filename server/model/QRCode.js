const mongoose = require("mongoose");

const QRCodeSchema = new mongoose.Schema({
    qrValue: {
        type: String,
        required: true,
        unique: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String }
    },
    assignedAt: {
        type: Date
    }
});

const QRCodeModel = mongoose.model("qrcodes", QRCodeSchema);

module.exports = QRCodeModel; 