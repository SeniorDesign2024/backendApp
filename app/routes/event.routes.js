const { authJwt } = require("../middlewares");
const controller = require("../controllers/event.controller");
const { verifyToken } = require("../middlewares/authJwt");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/event/test", controller.test);
  app.get("/api/event/next-event", [authJwt.verifyToken], controller.nextEvent);
  app.post("/api/event/process-event", [authJwt.verifyToken], controller.processEvent)
};
