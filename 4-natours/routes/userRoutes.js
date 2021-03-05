const express = require('express');
const {
  protect,
  signUp,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require('../controllers/authController');
const {
  getMe,
  getAllUsers,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
  updateMe,
  deleteMe,
} = require('../controllers/userController');

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);

router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

router.patch('/update-my-password', protect, updatePassword);

router.get('/me', protect, getMe, getUserById);
router.patch('/update-me', protect, updateMe);
router.delete('/delete-me', protect, deleteMe);

router.route('/').get(getAllUsers).post(createUser);

router
  .route('/:id')
  .get(getUserById)
  .patch(updateUserById)
  .delete(deleteUserById);

module.exports = router;
