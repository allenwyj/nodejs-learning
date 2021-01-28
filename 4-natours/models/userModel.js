const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    lowercase: true, // convert into lowercase automatically
    validate: [validator.isEmail, 'Email format is incorrect!'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minLength: 8,
    select: false, // never show password in any output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must confirm the password'],
    validate: {
      // This only works on .create() and .save()
      validator: function (currentField) {
        // getting the current field as parameter
        return currentField === this.password;
      },
      message: 'Passwords are not the same.',
    },
  },
  passwordChangedAt: Date,
});

// instance method - available on all documents in this collection
// becasue we've set select: false, so this.password is not available
userSchema.methods.matchPassword = async function (
  enteredPassword,
  userPassword
) {
  // compare the encrypted passwords
  return await bcrypt.compare(enteredPassword, userPassword);
};

userSchema.methods.changedPasswordAfterTokenIssued = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // convert date to (milliseconds / 1000)
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;

    // true: password has been changed after the last token was issued.
    return JWTTimestamp < changedTimestamp;
  }

  // Password not changed
  return false;
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // delete this field after password creating or updating successfully.
  this.passwordConfirm = undefined;

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
