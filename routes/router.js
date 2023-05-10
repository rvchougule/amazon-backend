const express = require("express");
const router = new express.Router();
const Products = require("../models/productsSchema");
const USER = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate");

// get products data api
router.get("/getproducts", async (req, res) => {
  try {
    const productsdata = await Products.find();
    // console.log("console the data  " + productsdata);
    res.status(201).json(productsdata);
  } catch (error) {
    console.log("error =>" + error.message);
  }
});

// Get individual data
router.get("/getproductsone/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(id);

    const individualdata = await Products.findOne({ id: id });
    // console.log(individualdata);

    res.status(201).json(individualdata);
  } catch (error) {
    res.status(400).json(individualdata);
    console.log("error =>" + error.message);
  }
});

// Register Data

router.post("/register", async (req, res) => {
  console.log(req.body);

  try {
    const { fname, email, mobile, password, cpassword } = req.body;
    if (!fname || !email || !mobile || !password || !cpassword) {
      res.status(422).json({ error: "fill the all data" });
      console.log("Data Not Available");
    }

    const preuser = await USER.findOne({ email: email });

    if (preuser) {
      res.status(422).json({ error: "this user is already registered" });
    } else if (password !== cpassword) {
      res
        .status(422)
        .json({ error: "Password and Confirm Password is Not Match" });
    } else {
      const finalUser = new USER({
        fname,
        email,
        mobile,
        password,
        cpassword,
      });

      const storedata = await finalUser.save();
      console.log(storedata);

      res.status(201).json(storedata);
    }
  } catch (error) {}
});

// Login user API

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    res.status(400).json({ error: "fill the all data" });
  }

  try {
    const userlogin = await USER.findOne({ email: email });
    console.log(userlogin);

    if (userlogin) {
      const isMatch = await bcrypt.compare(password, userlogin.password);
      // console.log(isMatch);

      if (!isMatch) {
        res.status(400).json({ error: "Invalid Details" });
      } else {
        // token generate
        const token = await userlogin.generateAuthToken();
        // console.log(token);

        res.cookie("Amazonweb", token, {
          expires: new Date(Date.now() + 900000),
          httpOnly: true,
        });

        res.status(201).json(userlogin);
      }
    } else {
      res.status(400).json({ error: "User not Registered" });
    }
  } catch (error) {
    res.status(400).json({ error: "Invalid Details" });
  }
});

// additing the data into cart

router.post("/addcart/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const cart = await Products.findOne({ id: id });
    console.log("cart value =>" + cart);

    const UserContact = await USER.findOne({ _id: req.userID });
    console.log("UserContact =>" + UserContact);

    if (UserContact) {
      const cartData = await UserContact.addcartdata(cart);
      await UserContact.save();
      res.status(201).json(UserContact);
      console.log("Cart DATA =>" + cartData);
    } else {
      res.status(401).json({ error: "Invalid User" });
    }
  } catch (error) {
    res.status(401).json({ error: "Invalid User" });
    console.log("Router Addcart error =>" + error);
  }
});

//get cart details
router.get("/cartdetails", authenticate, async (req, res) => {
  try {
    const buyuser = await USER.findOne({ _id: req.userID });
    res.status(201).json(buyuser);
  } catch (error) {
    console.log("error" + error);
  }
});

//get valid details
router.get("/validuser", authenticate, async (req, res) => {
  try {
    const validuserone = await USER.findOne({ _id: req.userID });
    res.status(201).json(validuserone);
  } catch (error) {
    console.log("error" + error);
  }
});

// remove item from cart

router.delete("/remove/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    req.rootUser.carts = req.rootUser.carts.filter((cruval) => {
      return cruval.id != id;
    });
    req.rootUser.save();
    res.status(201).json(req.rootUser);
    console.log("item removed successfully");
  } catch (error) {
    console.log("error" + error);
    res.status(400).json(req.rootUser);
  }
});

// for User Logout

router.get("/logout", authenticate, (req, res) => {
  try {
    req.rootUser.tokens = req.rootUser.tokens.filter((curelem) => {
      return curelem.token !== req.token;
    });

    res.clearCookie("Amazonweb", { path: "/" });
    req.rootUser.save();
    res.status(201).json(req.rootUser.tokens);
    console.log("user Logout");
  } catch (error) {
    console.log("error for user logout");
  }
});

module.exports = router;
