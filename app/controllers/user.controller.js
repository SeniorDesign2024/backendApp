const db = require("../models");
const User = db.user;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

exports.userDetails = (req, res) => {
  try {
    console.log("Entered UserDetails function in User controller");
    // Retrieve user ID from the request
    const userId = req.userId;

    // Find the user in the database by ID
    User.findById(userId, "email username", (err, user) => {
      if (err) {
        console.error("Error getting user details:", err);
        return res.status(500).json({ error: "Failed to get user details" });
      }

      // Check if user exists
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ error: "User not found" });
      }

      // Send email and username in the response
      res
        .status(200)
        .json({ userid: userId, email: user.email, username: user.username });
    });
  } catch (err) {
    console.log(err);
    res.status(400).send("Error getting user details");
  }
};

exports.updateUser = (req, res) => {
  try {
    console.log("Entered updateUser function in User controller");
    // Retrieve user ID from the request
    const userId = req.userId;

    // Extract email and username from request body
    const { email, username } = req.body;

    // Check if both email and username are provided
    if (!email || !username) {
      console.log("Email and username are required");
      return res.status(400).json({ error: "Email and username are required" });
    }

    // Check if the username is already taken
    User.findOne({ username: username }, (err, existingUser) => {
      if (err) {
        console.error("Error checking username:", err);
        return res.status(500).json({ error: "Error checking username" });
      }

      // If the username is taken by another user, return an error
      if (existingUser && existingUser._id.toString() !== userId) {
        console.log("Username is already taken");
        return res.status(400).json({ error: "Username is already taken" });
      }

      // Update user details in the database
      User.findByIdAndUpdate(
        userId,
        { email: email, username: username },
        { new: true },
        (err, updatedUser) => {
          if (err) {
            console.error("Error updating user:", err);
            return res.status(500).json({ error: "Failed to update user" });
          }

          // Check if user exists
          if (!updatedUser) {
            console.log("User not found");
            return res.status(404).json({ error: "User not found" });
          }

          // Send success message and updated user details
          res.status(200).json({
            message: "User details updated successfully",
            email: updatedUser.email,
            username: updatedUser.username,
          });
        }
      );
    });
  } catch (err) {
    console.log(err);
    res.status(400).send("Error updating user");
  }
};
