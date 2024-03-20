const { authJwt } = require("../middlewares");
const controller = require("../controllers/event.controller");
const { verifyToken } = require("../middlewares/authJwt");

module.exports = function(app, io) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/event/test", [authJwt.verifyToken], controller.test);
  app.get("/api/event/next-event", [authJwt.verifyToken], controller.nextEvent);
  app.post("/api/event/process-event", [authJwt.verifyToken], controller.processEvent(io))
  
  app.post("/api/event/create-event", [authJwt.verifyToken], controller.createEvent)
  app.get("/api/event/list-events", [authJwt.verifyToken], controller.listEvents)
  app.post("/api/event/event-details", [authJwt.verifyToken], controller.eventDetails)
  app.post("/api/event/update-event", [authJwt.verifyToken], controller.updateEvent)
};
