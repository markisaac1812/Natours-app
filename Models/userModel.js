const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'user must have a name'],
    minlength: [3, 'name must be above 3 char']
  },
  email: {
    type: String,
    required: [true, 'user must have a valid email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'invalid email']
  },
  role: {
    type: String,
    enum: ["user","guide","lead-guide","admin"],
    default: "user"
  },
  photo: {
    type: String,
    default: "default.jpg"
  },
  password: {
    type: String,
    required: [true, 'user must have a password'],
    minlength: 8,
    select : false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'please confirm password'],
    validate: {
      // this works only on save or create
      validator: function (pass) {
        return pass === this.password;
      },
      message: "passwords are not the same"
    }
  },
  passwordChangedAt: {
    type : Date
  },
  passwordResetToken : {
    type : String
  },
  passwordResetExpires: {
    type : Date
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  }
});

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    // hash password in the response
    this.password = await bcrypt.hash(this.password,12);

    // delete confirm password from response
    this.confirmPassword = undefined;
    next();
});

userSchema.pre("save",function(next){
  if(!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() -1000;
  next();
});

userSchema.pre(/^find/ ,function(next){
  this.find({active: {$ne: false}});
  next();
});

userSchema.methods.correctPassword = async function(passwordInTheRequest,passwordInDB){
    return await bcrypt.compare(passwordInTheRequest,passwordInDB);
}

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp){
  if(this.passwordChangedAt){
    const chanagedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
    return JWTTimeStamp < chanagedTimestamp; 
  }
  return false;
}

userSchema.methods.createPasswordResetToken = function (){
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
}

const User = mongoose.model('User', userSchema);
module.exports = User;
