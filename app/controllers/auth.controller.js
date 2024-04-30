const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

/**
 * Registers a new user
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @return {void} Returns a JSON response indicating success or failure of the registration
 */
exports.signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles },
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map((role) => role._id);
          user.save((err) => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save((err) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

/**
 * Authenticates a user
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @return {void} Returns a JSON response with user details and access token upon successful authentication
 */
exports.signin = (req, res) => {
  User.findOne({
    username: req.body.username,
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!",
        });
      }

      const token = jwt.sign({ id: user.id }, config.secret, {
        algorithm: "HS256",
        allowInsecureKeySizes: true,
        expiresIn: 86400, // 24 hours
      });

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }

      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        accessToken: token,
      });
    });
};

/**
 * Logs out a user by clearing the session token
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @return {void} Returns a JSON response indicating successful logout
 */
exports.logout = (req, res) => {
  req.session.token = null; // Clear the session token
  res.status(200).send({ message: "Logout successful" }); // Send a response
};

/**
 * Resets the password for a user
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @return {void} Returns a JSON response indicating success or failure of the password reset
 */
exports.resetPassword = (req, res) => {
  try {

    if (!req.body.oldPassword || !req.body.newPassword) {
      return res
        .status(400)
        .send({ error: "Both old password and new password are required." });
    }

    // Confirm old password
    User.findById(req.userId, (err, user) => {
      if (err) {
        return res.status(500).send({ error: err.message });
      }

      if (!user) {
        return res.status(404).send({ error: "User not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.oldPassword,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(400).send({ error: "Invalid old password." });
      }

      // Store the new password
      user.password = bcrypt.hashSync(req.body.newPassword, 8);
      user.save((err, user) => {
        if (err) {
          return res.status(500).send({ error: err.message });
        }

        // Create token and store it in the session
        const token = jwt.sign({ id: user.id }, config.secret, {
          algorithm: "HS256",
          allowInsecureKeySizes: true,
          expiresIn: 86400, // 24 hours
        });

        var authorities = [];
        for (let i = 0; i < user.roles.length; i++) {
          if (user.roles[i].name) {
            authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
          }
        }
        req.session.token = token;

        res.status(200).send({
          message: "Password reset successfully.",
          accessToken: token,
        });
      });
    });
  } catch (err) {
    res.status(400).send("Error resetting password");
  }
};
