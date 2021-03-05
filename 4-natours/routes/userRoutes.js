const express = require('express');
const {
  protect,
  restrictTo,
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

// Adding a middleware - any request hitting the rest of routes,
// will need to pass this protect middleware first.
// Protecting the all routes after this point.
router.use(protect);

router.patch('/update-my-password', updatePassword);
router.get('/me', getMe, getUserById);
router.patch('/update-me', updateMe);
router.delete('/delete-me', deleteMe);

router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);

router
  .route('/:id')
  .get(getUserById)
  .patch(updateUserById)
  .delete(deleteUserById);

module.exports = router;
