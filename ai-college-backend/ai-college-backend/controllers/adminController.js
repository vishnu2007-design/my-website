const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');

// POST /api/admin/students
exports.addStudent = async (req, res) => {
  try {
    const { name, username, password, studentId, courseCode, year } = req.body;
    if (!name || !username || !password || !studentId || !courseCode || !year) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const course = await Course.findOne({ code: courseCode.toUpperCase() });
    if (!course) return res.status(404).json({ message: `Course ${courseCode} not found.` });

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) return res.status(409).json({ message: 'Username already taken.' });

    const user = await User.create({ name, username, password, role: 'student' });

    const attendance = course.subjects.map((s) => ({ subject: s, present: 0, total: 0 }));
    const marks = course.subjects.map((s) => ({ subject: s, score: 0 }));

    const student = await Student.create({
      user: user._id,
      studentId,
      course: course._id,
      year,
      attendance,
      marks
    });

    res.status(201).json({ message: `Student ${name} added.`, student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate student ID or username.' });
    }
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// POST /api/admin/faculty
exports.addFaculty = async (req, res) => {
  try {
    const { name, username, password, facultyId, subject, courseCode } = req.body;
    if (!name || !username || !password || !facultyId || !subject || !courseCode) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const course = await Course.findOne({ code: courseCode.toUpperCase() });
    if (!course) return res.status(404).json({ message: `Course ${courseCode} not found.` });
    if (!course.subjects.includes(subject)) {
      return res.status(400).json({ message: `Subject "${subject}" is not part of course ${courseCode}.` });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) return res.status(409).json({ message: 'Username already taken.' });

    const user = await User.create({ name, username, password, role: 'faculty' });
    const faculty = await Faculty.create({ user: user._id, facultyId, subject, course: course._id });

    res.status(201).json({ message: `Faculty ${name} added.`, faculty });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate faculty ID or username.' });
    }
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// GET /api/admin/faculty
exports.getFaculty = async (req, res) => {
  try {
    const facultyList = await Faculty.find()
      .populate('user', 'name username')
      .populate('course', 'name code subjects');
    res.json({
      faculty: facultyList.map((f) => ({
        id: f._id,
        facultyId: f.facultyId,
        name: f.user.name,
        username: f.user.username,
        subject: f.subject,
        course: { code: f.course.code, name: f.course.name, subjects: f.course.subjects }
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// PUT /api/admin/faculty/:id  { subject, courseCode? }
// courseCode is optional — only send it if you're reassigning the faculty
// member to a different course as well as changing their subject.
exports.updateFaculty = async (req, res) => {
  try {
    const { subject, courseCode } = req.body;
    if (!subject) return res.status(400).json({ message: 'A subject is required.' });

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty member not found.' });

    let course = await Course.findById(faculty.course);

    if (courseCode) {
      const newCourse = await Course.findOne({ code: courseCode.toUpperCase() });
      if (!newCourse) return res.status(404).json({ message: `Course ${courseCode} not found.` });
      course = newCourse;
    }

    if (!course.subjects.includes(subject)) {
      return res.status(400).json({ message: `Subject "${subject}" is not part of course ${course.code}.` });
    }

    faculty.subject = subject;
    faculty.course = course._id;
    await faculty.save();

    res.json({ message: `${faculty.facultyId} is now teaching ${subject}.`, faculty });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// POST /api/admin/courses  { code, name, subjects: [String] }
exports.addCourse = async (req, res) => {
  try {
    const { code, name, subjects } = req.body;
    if (!code || !name || !Array.isArray(subjects) || !subjects.length) {
      return res.status(400).json({ message: 'code, name, and a non-empty subjects array are required.' });
    }

    const existing = await Course.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(409).json({ message: `Course ${code} already exists.` });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const timetable = {};
    days.forEach((d, i) => {
      timetable[d] = subjects.map((_, idx) => subjects[(idx + i) % subjects.length]);
    });

    const course = await Course.create({ code: code.toUpperCase(), name, subjects, timetable });
    res.status(201).json({ message: `Course ${name} added.`, course });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// GET /api/admin/courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// DELETE /api/admin/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const inUse =
      (await Student.exists({ course: req.params.id })) ||
      (await Faculty.exists({ course: req.params.id }));
    if (inUse) {
      return res.status(409).json({ message: 'Cannot delete a course with enrolled students or assigned faculty.' });
    }

    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Course not found.' });

    res.json({ message: `Course ${deleted.name} deleted.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// GET /api/admin/reports
exports.getReports = async (req, res) => {
  try {
    const students = await Student.find().populate('course');
    const faculty = await Faculty.find();
    const courses = await Course.find();

    const overall = (s) => {
      const totals = s.attendance.reduce(
        (acc, a) => ({ present: acc.present + a.present, total: acc.total + a.total }),
        { present: 0, total: 0 }
      );
      const attendancePct = totals.total ? Math.round((totals.present / totals.total) * 100) : 0;
      const avgMarks = s.marks.length
        ? Math.round(s.marks.reduce((a, m) => a + m.score, 0) / s.marks.length)
        : 0;
      return { attendancePct, avgMarks };
    };

    const studentStats = students.map((s) => ({ studentId: s.studentId, ...overall(s) }));
    const avgAttendance = studentStats.length
      ? Math.round(studentStats.reduce((a, s) => a + s.attendancePct, 0) / studentStats.length)
      : 0;
    const avgMarks = studentStats.length
      ? Math.round(studentStats.reduce((a, s) => a + s.avgMarks, 0) / studentStats.length)
      : 0;
    const atRisk = studentStats.filter((s) => s.attendancePct < 75);

    const courseStats = courses.map((c) => {
      const cs = students.filter((s) => String(s.course._id) === String(c._id)).map(overall);
      const a = cs.length ? Math.round(cs.reduce((x, s) => x + s.attendancePct, 0) / cs.length) : 0;
      const m = cs.length ? Math.round(cs.reduce((x, s) => x + s.avgMarks, 0) / cs.length) : 0;
      return { course: c.name, students: cs.length, avgAttendance: a, avgMarks: m };
    });

    res.json({
      totals: { students: students.length, faculty: faculty.length, courses: courses.length },
      avgAttendance,
      avgMarks,
      atRisk,
      courseStats
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};
