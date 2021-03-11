const crypto = require('crypto');
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
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'lead-guide'],
    default: 'user',
  },
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
      // Doesn't work with findXXXAndUpdate()
      validator: function (currentField) {
        // getting the current field as parameter
        return currentField === this.password;
      },
      message: 'Passwords are not the same.',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
    require: [true, 'A user must be active or inactive'],
  },
});

// Schema instance method
// hashing password before saving into the DB
userSchema.pre('save', async function (next) {
  // Returns if it is not modifying the password
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // delete this field after password creating or updating successfully.
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  // Return if it isn't modifying the password or the document is newly created.
  if (!this.isModified('password') || this.isNew) return next();

  // To minify the problem that the timestamp of the new issued token < passwordChangedAt.
  // Should be: new issued token > passwordChangedAt
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// Query middleware - any query starts with find
// Only find the active user.
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });

  next();
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

// instance method - validating the token.
// Returns true if token is newer than the timestamp of password changed
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

// NOTE: Running this instance method is only to modify fields, but
// the changes are not saved.
userSchema.methods.createPasswordResetToken = function () {
  // Generate a random token which is like a temporary password for user
  // to gain access to our server and reset their password.
  // It should not be stored as a plain token in the database - needs encrypted.
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Store the encrypted token in the current document
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // expires in 10 mins
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
