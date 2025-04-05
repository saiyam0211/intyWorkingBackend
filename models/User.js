// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['company', 'designer', 'craftsman', 'user'], required: true },
    userCredit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserCredit'
    }
});

// Add compound index to ensure email+role combination is unique
// This allows same email to be used with different roles
userSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);