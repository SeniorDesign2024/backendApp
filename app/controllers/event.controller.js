const db = require("../models");
const User = db.user;
const Role = db.role;
const Event = db.event;

exports.test = (req, res) => {
  console.log("hello")
  res.json({message: "Event Test"});
};

exports.nextEvent = async (req, res) => {
  retrived_user = req.userId
  try {
    //const user = await User.findOne({username: retrived_user}).exec()
    //const curUserId = user._id;
    const eventList = await Event.findOne({userId: retrived_user}).sort('startTime').exec()
    console.log(eventList);
    if (eventList) {
      res.status(200).json({
        event_id: eventList._id,
        timestamp: eventList.startTime,
        name: eventList.name
      });
    } else {
      res.status(400).send('No event found for the user.')
    }
    
  } catch (err) {
    console.log(err)
    res.status(400).send("Error processing the user")
  }
}

exports.processEvent = async(req, res) => {
  rv = Math.floor(Math.random() * 1000);
  res.status(200).json({
    attendance: rv
  })
}
