const db = require("../models");
const ROLES = db.ROLES;
const User = db.user;

/**
 * Middleware to check for duplicate username or email during user signup
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @param {Function} next The next middleware function
 * @return {void} Returns a JSON response indicating duplicate username or email if found, otherwise calls the next middleware function
 */
checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Username
  User.findOne({
    username: req.body.username
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (user) {
      res.status(400).send({ message: "Failed! Username is already in use!" });
      return;
    }

    // Email
    User.findOne({
      email: req.body.email
    }).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (user) {
        res.status(400).send({ message: "Failed! Email is already in use!" });
        return;
      }

      next();
    });
  });
};

/**
 * Middleware to check if provided roles exist
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @param {Function} next The next middleware function
 * @return {void} Returns a JSON response indicating non-existent roles if found, otherwise calls the next middleware function
 */
checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`
        });
        return;
      }
    }
  }

  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted
};

module.exports = verifySignUp;
