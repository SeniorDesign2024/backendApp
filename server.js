require('dotenv').config();
const express = require("express");
const cors = require("cors");
const cookieSession = require('express-session')
const app = express();
const socketIo = require('socket.io')
const http = require('http')
const socketAuth = require("./app/middlewares/socketAuth");

var corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:8181"]
};

app.use(cors(corsOptions));
const server = http.createServer(app);
const io = socketIo(server, {
  cors: corsOptions 
});

// parse requests of content-type - application/json
app.use(express.json({limit: '50mb', extended: true}));

app.set('trust proxy', 1)

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ limit: "50mb",extended: true }));

app.use(
  cookieSession({
    name: "bezkoder-session",
    secret: "COOKIE_SECRET", // should use as secret environment variable
    cookie: {
      maxAge: 86400000, // 24 hours
      secure: false, // Requires HTTPS
      httpOnly: true, // Can't be accessed via JavaScript
      sameSite: 'strict', // Recommended for CSRF protection
    }
  })
);

const db = require("./app/models");
const Role = db.role;

db.mongoose
  .connect(process.env.DBCONFIG, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});

socketAuth(io);
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.join(`user:${socket.user}`);
  console.log('Authenticated user:', socket.user);
  socket.on('disconnect', () => {
    console.log('A user disconnected')
  });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/event.routes")(app, io); // <- NEW

// set port, listen for requests
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "moderator"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'moderator' to roles collection");
      });

      new Role({
        name: "admin"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'admin' to roles collection");
      });
    }
  });
}
