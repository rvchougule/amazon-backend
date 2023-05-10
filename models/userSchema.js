const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secretKey = process.env.KEY;

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email Address");
      }
    },
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  cpassword: {
    type: String,
    required: true,
    minlength: 6,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  carts: Array,
});

// Decrypt the password
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
    this.cpassword = await bcrypt.hash(this.cpassword, 12);
  }

  next();
});

//token generate
userSchema.methods.generateAuthToken = async function () {
  try {
    // token generation       payload      secretKey
    let token_one = jwt.sign({ _id: this._id }, secretKey);
    this.tokens = this.tokens.concat({ token: token_one });

    await this.save(); //save to mongoDB
    return token_one;
  } catch (error) {
    console.log(error);
  }
};

// Add to cart data
userSchema.methods.addcartdata = async function(cart){
  try {
      this.carts = this.carts.concat(cart);
      // console.log("this.carts => "+this.carts);
      await this.save();
      return this.carts;
  } catch (error) {
      console.log(error);
  }
}

const USER = new mongoose.model("USER", userSchema);

module.exports = USER;
