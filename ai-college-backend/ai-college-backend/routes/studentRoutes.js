const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/studentController');

// Every route below requires a valid JWT belonging to a 'student'.
router.use(verifyToken, authorize('student'));

router.get('/profile', ctrl.getProfile);
router.get('/attendance', ctrl.getAttendance);
router.get('/marks', ctrl.getMarks);
router.get('/timetable', ctrl.getTimetable);
router.post('/ask-ai', ctrl.askAI);

module.exports = router;
