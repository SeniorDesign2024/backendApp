const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;
const Role = db.role;

/**
 * Middleware to verify JWT token in the request headers
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @param {Function} next The next middleware function
 * @return {void} Returns a JSON response indicating success or failure of token verification
 */
verifyToken = (req, res, next) => {
  //let token = req.session.token; THIS IS THE CHANGE IN AUTH
  let token = req.headers["x-access-token"];
  
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token,
            config.secret,
            (err, decoded) => {
              if (err) {
                return res.status(401).send({
                  message: "Unauthorized!",
                });
              }
              req.userId = decoded.id;
              next();
            });
};

/**
 * Middleware to check if the user has admin role
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @param {Function} next The next middleware function
 * @return {void} Returns a JSON response indicating success or failure of role check
 */
isAdmin = (req, res, next) => {
  User.findById(req.userId).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    Role.find(
      {
        _id: { $in: user.roles }
      },
      (err, roles) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "admin") {
            next();
            return;
          }
        }

        res.status(403).send({ message: "Require Admin Role!" });
        return;
      }
    );
  });
};

/**
 * Middleware to check if the user has moderator role
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @param {Function} next The next middleware function
 * @return {void} Returns a JSON response indicating success or failure of role check
 */
isModerator = (req, res, next) => {
  User.findById(req.userId).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    Role.find(
      {
        _id: { $in: user.roles }
      },
      (err, roles) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "moderator") {
            next();
            return;
          }
        }

        res.status(403).send({ message: "Require Moderator Role!" });
        return;
      }
    );
  });
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator
};
module.exports = authJwt;
