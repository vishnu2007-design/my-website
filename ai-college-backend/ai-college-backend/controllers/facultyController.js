const Faculty = require('../models/Faculty');
const Student = require('../models/Student');

async function getFacultyByUserId(userId) {
  return Faculty.findOne({ user: userId }).populate('course');
}

// GET /api/faculty/students
exports.getMyStudents = async (req, res) => {
  try {
    const faculty = await getFacultyByUserId(req.user.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty record not found.' });

    const students = await Student.find({ course: faculty.course._id }).populate('user', 'name');

    res.json({
      subject: faculty.subject,
      course: faculty.course.name,
      students: students.map((s) => ({
        studentId: s.studentId,
        name: s.user.name,
        year: s.year,
        attendance: s.attendance,
        marks: s.marks
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// POST /api/faculty/attendance  { studentId, status: 'present' | 'absent' }
exports.addAttendance = async (req, res) => {
  try {
    const { studentId, status } = req.body;
    if (!studentId || !['present', 'absent'].includes(status)) {
      return res.status(400).json({ message: 'studentId and a valid status (present/absent) are required.' });
    }

    const faculty = await getFacultyByUserId(req.user.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty record not found.' });

    const student = await Student.findOne({ studentId, course: faculty.course._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in your course.' });
    }

    let entry = student.attendance.find((a) => a.subject === faculty.subject);
    if (!entry) {
      entry = { subject: faculty.subject, present: 0, total: 0 };
      student.attendance.push(entry);
    }
    entry.total += 1;
    if (status === 'present') entry.present += 1;

    await student.save();
    res.json({
      message: `Attendance recorded for ${studentId} in ${faculty.subject}.`,
      attendance: student.attendance
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// PUT /api/faculty/marks  { studentId, score }
exports.updateMarks = async (req, res) => {
  try {
    const { studentId, score } = req.body;
    if (!studentId || score === undefined || score < 0 || score > 100) {
      return res.status(400).json({ message: 'studentId and a score between 0-100 are required.' });
    }

    const faculty = await getFacultyByUserId(req.user.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty record not found.' });

    const student = await Student.findOne({ studentId, course: faculty.course._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in your course.' });
    }

    let entry = student.marks.find((m) => m.subject === faculty.subject);
    if (!entry) {
      entry = { subject: faculty.subject, score };
      student.marks.push(entry);
    } else {
      entry.score = score;
    }

    await student.save();
    res.json({
      message: `Marks updated for ${studentId} in ${faculty.subject}.`,
      marks: student.marks
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};
