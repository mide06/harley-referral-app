const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Welcome to the Landing Page");
});

router.get("/register", (req, res) => {
  res.send("This is the Register Page");
});

router.get("/login", (req, res) => {
  res.send("This is the Login Page");
});

router.get("/dashboard", (req, res) => {
  res.send("This is the Dashboard Page");
});

router.get("/form", (req, res) => {
  res.send("This is the Form Page");
});

module.exports = router;
