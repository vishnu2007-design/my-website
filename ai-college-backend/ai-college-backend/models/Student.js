const mongoose = require('mongoose');

const attendanceEntry = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    present: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const marksEntry = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    score: { type: Number, default: 0, min: 0, max: 100 }
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    studentId: { type: String, required: true, unique: true, trim: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    year: { type: Number, required: true, min: 1, max: 6 },
    attendance: { type: [attendanceEntry], default: [] },
    marks: { type: [marksEntry], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
