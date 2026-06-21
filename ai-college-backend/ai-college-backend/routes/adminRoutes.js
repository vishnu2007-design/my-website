const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

// Every route below requires a valid JWT belonging to an 'admin' user.
router.use(verifyToken, authorize('admin'));

router.post('/students', ctrl.addStudent);
router.post('/faculty', ctrl.addFaculty);
router.get('/faculty', ctrl.getFaculty);
router.put('/faculty/:id', ctrl.updateFaculty);
router.post('/courses', ctrl.addCourse);
router.get('/courses', ctrl.getCourses);
router.delete('/courses/:id', ctrl.deleteCourse);
router.get('/reports', ctrl.getReports);

module.exports = router;
