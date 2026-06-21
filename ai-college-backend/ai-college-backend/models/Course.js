const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    name: { type: String, required: true, trim: true },
    subjects: {
      type: [String],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0
    },
    timetable: {
      Mon: { type: [String], default: [] },
      Tue: { type: [String], default: [] },
      Wed: { type: [String], default: [] },
      Thu: { type: [String], default: [] },
      Fri: { type: [String], default: [] }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
