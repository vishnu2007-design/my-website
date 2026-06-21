// Run with: npm run seed
// Wipes existing data and creates a full demo dataset: one course,
// several faculty, several students, and a couple of admin accounts.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');

function buildTimetable(subjects) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const timetable = {};
  days.forEach((d, i) => {
    timetable[d] = subjects.map((_, idx) => subjects[(idx + i) % subjects.length]);
  });
  return timetable;
}

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Faculty.deleteMany({}),
    Course.deleteMany({})
  ]);

  // ---------- Course ----------
  const subjects = ['Python', 'Java', 'Machine Learning', 'Data Structures', 'DBMS'];
  const course = await Course.create({
    code: 'CSEAIML',
    name: 'Computer Science Engineering — AI & ML',
    subjects,
    timetable: buildTimetable(subjects)
  });

  // ---------- Admins ----------
  await User.create({ name: 'Administrator', username: 'admin', password: 'admin123', role: 'admin' });
  await User.create({ name: 'Assistant Administrator', username: 'admin2', password: 'admin123', role: 'admin' });

  // ---------- Faculty ----------
  const facultyList = [
    { facultyId: 'F101', name: 'Dr. Ananya Rao', username: 'f101', subject: 'Python' },
    { facultyId: 'F102', name: 'Mr. Karthik Iyer', username: 'f102', subject: 'Java' },
    { facultyId: 'F103', name: 'Dr. Sneha Kulkarni', username: 'f103', subject: 'Machine Learning' },
    { facultyId: 'F104', name: 'Mr. Arjun Mehta', username: 'f104', subject: 'Data Structures' }
  ];
  for (const f of facultyList) {
    const user = await User.create({ name: f.name, username: f.username, password: 'faculty123', role: 'faculty' });
    await Faculty.create({ user: user._id, facultyId: f.facultyId, subject: f.subject, course: course._id });
  }

  // ---------- Students ----------
  const studentList = [
    {
      studentId: 'S101', name: 'Rahul Sharma', username: 's101', year: 3,
      attendance: { Python: [19, 20], Java: [18, 20], 'Machine Learning': [20, 20], 'Data Structures': [17, 20], DBMS: [19, 20] },
      marks: { Python: 85, Java: 79, 'Machine Learning': 91, 'Data Structures': 73, DBMS: 84 }
    },
    {
      studentId: 'S102', name: 'Priya Singh', username: 's102', year: 3,
      attendance: { Python: [20, 20], Java: [19, 20], 'Machine Learning': [18, 20], 'Data Structures': [19, 20], DBMS: [20, 20] },
      marks: { Python: 92, Java: 88, 'Machine Learning': 80, 'Data Structures': 85, DBMS: 90 }
    },
    {
      studentId: 'S103', name: 'Aditya Verma', username: 's103', year: 3,
      attendance: { Python: [11, 20], Java: [13, 20], 'Machine Learning': [14, 20], 'Data Structures': [10, 20], DBMS: [12, 20] },
      marks: { Python: 58, Java: 61, 'Machine Learning': 64, 'Data Structures': 52, DBMS: 49 }
    },
    {
      studentId: 'S104', name: 'Sneha Patel', username: 's104', year: 3,
      attendance: { Python: [16, 20], Java: [15, 20], 'Machine Learning': [17, 20], 'Data Structures': [16, 20], DBMS: [14, 20] },
      marks: { Python: 70, Java: 66, 'Machine Learning': 74, 'Data Structures': 69, DBMS: 60 }
    }
  ];

  for (const s of studentList) {
    const user = await User.create({ name: s.name, username: s.username, password: 'student123', role: 'student' });
    const attendance = subjects.map((sub) => ({
      subject: sub,
      present: s.attendance[sub][0],
      total: s.attendance[sub][1]
    }));
    const marks = subjects.map((sub) => ({ subject: sub, score: s.marks[sub] }));
    await Student.create({ user: user._id, studentId: s.studentId, course: course._id, year: s.year, attendance, marks });
  }

  console.log('\nSeed complete. Demo logins (password shown next to each):\n');
  console.log('  ADMIN    admin / admin123');
  console.log('  ADMIN    admin2 / admin123');
  facultyList.forEach((f) => console.log(`  FACULTY  ${f.username} / faculty123   (${f.name} — ${f.subject})`));
  studentList.forEach((s) => console.log(`  STUDENT  ${s.username} / student123   (${s.name})`));
  console.log('');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
