const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// this is our schema to represent a restaurant
const userInfoSchema = mongoose.Schema({
  email: {type: String, required: true},
  user_password: {type: String, required: true}
});

userInfoSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
}

userInfoSchema.statics.hashPassword = function(password) {
  //console.log(password);
  return bcrypt.hash(password, 10);
}

// note that all instance methods and virtual properties on our
// schema must be defined *before* we make the call to `.model`.
const Userid = mongoose.model('Userid', userInfoSchema);

module.exports = {Userid};