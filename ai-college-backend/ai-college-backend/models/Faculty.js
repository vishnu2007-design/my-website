const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    facultyId: { type: String, required: true, unique: true, trim: true },
    subject: { type: String, required: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', facultySchema);
