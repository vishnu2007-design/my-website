const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Single source of truth for authentication. Role-specific data
// (course, attendance, marks, subject taught, etc.) lives in the
// Student / Faculty collections and references this document.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      required: true
    }
  },
  { timestamps: true }
);

// Hash the password automatically whenever it is set or changed.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Never leak the password hash in API responses.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
