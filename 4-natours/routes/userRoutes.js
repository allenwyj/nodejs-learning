const express = require('express');
const { signUp, login } = require('../controllers/authController');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
} = require('../controllers/userController');

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);

router.route('/').get(getAllUsers).post(createUser);

router
  .route('/:id')
  .get(getUserById)
  .patch(updateUserById)
  .delete(deleteUserById);

module.exports = router;
