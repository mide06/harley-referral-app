require("dotenv").config()
const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const appUrl = process.env.APP_URL
const router = express.Router();

// --------------------- FORM SUBMISSION ---------------------
// Ensure preflight requests are handled (some environments may respond 405 otherwise)
router.options('/submit', (req, res) => {
  res.sendStatus(200);
});

router.post("/submit", async (req, res) => {
  try {
    const { referrerUsername, ...formAnswers } = req.body;

    if (!formAnswers.name || !formAnswers.email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    // Find or create the user submitting the form
    let formUser = await User.findOne({ email: formAnswers.email });
    if (!formUser) {
      formUser = new User({
        name: formAnswers.name,
        username: formAnswers.email.split("@")[0],
        email: formAnswers.email,
        password: await bcrypt.hash("temporary123", 10), // temporary password
        formData: {},
      });
    }

    // Save all form answers dynamically
    formUser.formData = formAnswers;
    await formUser.save();

    // Update referrer's dashboard
    if (referrerUsername) {
      const referrer = await User.findOne({ username: referrerUsername });
      if (referrer) {
        const existingReferral = referrer.referrals.find(
          (r) => r.userId.toString() === formUser._id.toString()
        );

        if (existingReferral) {
          existingReferral.status = "filled";
        } else {
          referrer.referrals.push({ userId: formUser._id, status: "filled" });
        }

        await referrer.save();
      }
    }

    res.json({ success: true, message: "Form submitted successfully" });
  } catch (err) {
    console.error("❌ Form Submission Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --------------------- DASHBOARD ---------------------
router.get("/dashboard/:username", async (req, res) => {
  try {
    const username = req.params.username?.trim();
    if (!username)
      return res.status(400).json({ success: false, message: "Username is required" });

    const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") })
      .populate("referrals.userId", "name email");

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const totalReferrals = user.referrals.length;
const filledReferrals = user.referrals.filter((r) => r.status === "filled").length;

res.json({
  success: true,
  name: user.name,
  username: user.username,
  email: user.email,
  referralLink: `${appUrl}/survey-form-folder/survey.html?ref=${username}`,
  totalReferrals,
  filledReferrals,
  referrals: user.referrals.map((r) => ({
    name: r.userId?.name || "Unknown",
    email: r.userId?.email || "Unknown",
    status: r.status,
  })),
});

  } catch (err) {
    console.error("❌ Dashboard Fetch Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
