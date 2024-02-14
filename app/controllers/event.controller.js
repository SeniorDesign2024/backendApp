
const db = require("../models");
const User = db.user;
const Role = db.role;
const Event = db.event;

const Event = require("../models/event.model");


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

  exports.createEvent = (req, res) => {
    console.log("Entered createEvent function in Event controller");

    //Storing user id
    const user_id=req.userId;
    //console.log(user_id);

    // Extract details from request body
    const { name, startTime, endTime, complianceLimit, attendance } = req.body;
  
    // Check if all required fields are provided
    if (!name || !startTime || !endTime || !complianceLimit || !attendance) {
      console.log("Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Create a new event instance
    const event = new Event({
      name,
      startTime,
      endTime,
      userId: user_id,
      complianceLimit,
      attendance: attendance
    });
  
    // Save the event to the database
    event.save((err, savedEvent) => {
      if (err) {
        console.error("Error creating event:", err);
        return res.status(500).json({ error: "Failed to create event" });
      }
  
      // Event created successfully, return event ID
      res.status(200).json({ eventId: savedEvent._id });
    });
  };


  exports.listEvents = (req, res) => {
    console.log("Entered listEvents function in Event controller");

    const userId = req.userId;

    // Fetch all events from the database
    Event.find({ userId }, (err, events) => {
      if (err) {
        console.error("Error getting events:", err);
        return res.status(500).json({ error: "Failed to list events" });
      }

      // Extract relevant details (startTime, name, id) from each event
      const eventData = events.map(event => ({
        startTime: event.startTime,
        name: event.name,
        eventId: event._id
      }));
  
      // Send the extracted data in the response
      res.status(200).json({ data: eventData });
    });
  };

  exports.eventDetails = (req, res) => {
    console.log("Entered eventDetails function in Event controller");

    const { eventId } = req.body;
  
    // Check if event ID is provided
    if (!eventId) {
      console.log("Event ID is required");
      return res.status(400).json({ error: "Event ID is required" });
    }
  
    // Fetch the event details from the database based on the provided event ID
    Event.findById(eventId, (err, event) => {
      if (err) {
        console.error("Error getting event details:", err);
        return res.status(500).json({ error: "Failed to get event details" });
      }
  
      // Check if event exists
      if (!event) {
        console.log("Event not found:");
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if the event is registered to the user that created it
      if (!event.userId.equals(req.userId)) {
        console.log("Unauthorized access to event details");
        return res.status(403).json({ error: "Unauthorized access to event details" });
    }
  
      // Send the event details in the response
      res.status(200).json({
        startTime: event.startTime,
        endTime: event.endTime,
        complianceLimit: event.complianceLimit,
        name: event.name,
        eventId: event._id,
        attendance: event.attendance,
      });
    });
  };

  exports.updateEvent = (req, res) => {
    console.log("Entered updateEvent function in Event controller");

    const { eventId, name, startTime, endTime, complianceLimit, attendance } = req.body;
  
    // Check if all required fields are provided
    if (!eventId || !name || !startTime || !endTime || !complianceLimit || !attendance) {
      console.log("Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

  // Find the event by ID and check if it's registered to the user below
  Event.findById(eventId, (err, event) => {
    if (err) {
      console.error("Error finding event:", err);
      return res.status(500).json({ error: "Failed to find event" });
    }

    if (!event) {
      console.log("Event not found");
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if the event is registered to the user
    if (!event.userId.equals(req.userId)) {
      console.log("Unauthorized access to update event");
      return res.status(403).json({ error: "Unauthorized access to update event" });
    }
  
    // Find the event by ID and update its details
    Event.findByIdAndUpdate(eventId, { name, startTime, endTime, complianceLimit, attendance }, { new: true }, (err, updatedEvent) => {
      if (err) {
        console.error("Error updating event:", err);
        return res.status(500).json({ error: "Failed to update event" });
      }
  
      // Check if event exists
      if (!updatedEvent) {
        console.log("Event not found");
        return res.status(404).json({ error: "Event not found" });
      }
  
      // Event updated successfully
      res.status(200).json({ message: "Event updated successfully" });
    });
  });
}
