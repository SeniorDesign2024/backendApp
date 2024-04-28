const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");

/**
 * Middleware for authorizing a user requesting for a socket connection
 * @param {Object} io The socket object
 */
const socketAuth = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.headers['x-access-token'];
        console.log('authorizing');
        if (!token) {
            return next(new Error("Authentication error"));
        }

        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                return next(new Error("Authentication error"));
            }
            socket.user = decoded.id;
            next();
        });
    });
};

module.exports = socketAuth;