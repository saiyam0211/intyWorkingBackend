// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['company', 'designer', 'craftsman', 'user'], required: true },
    userCredit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserCredit'
    }
});

module.exports = mongoose.model('User', userSchema);