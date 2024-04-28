const db = require("../models");
const User = db.user;
const Role = db.role;
const Event = db.event;
const axios = require('axios')
const http = require('http');
const NodeCache = require('node-cache');
const eventCache = new NodeCache();
const { isObjectIdOrHexString } = require("mongoose");


exports.test = (req, res) => {
  console.log("hello");
  res.json({ message: "Event Test" });
};

/**
 * Retrieves the upcoming event for the user
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @return {Promise<void>} A promise that is resolved after the upcoming event is retrieved.
 */
exports.nextEvent = async (req, res) => {
  retrived_user = req.userId;
  try {
    const now = new Date();
    const eventList = await Event.findOne({ userId: retrived_user, endTime : {$gt : now} })
      .sort("startTime")
      .exec();
    if (eventList) {
      res.status(200).json({
        event_id: eventList._id,
        timestamp: eventList.startTime,
        name: eventList.name,
        modelToUse: eventList.mlModel
      });
    } else {
      res.status(400).send("No event found for the user.");
    }
  } catch (err) {
    res.status(400).send("Error processing the user");
  }
};

/**
 * Forward crowd counting requests to the crowd Counting server, forward the calculated count to the 
 * front-end in real-time using websocket, and stores the count to the database.
 * @param {Object} req The request object (eventId, image)
 * @param {Object} res The response object
 * @return {Promise<void>} A promise that is resolved after the count is received from the counting server.
 */
exports.processEvent = (io) => async(req, res) => {
  const eventId = req.body.event_id;
  const imageData = req.body.image;
  const userId = req.userId;
  let eventDetails = eventCache.get(eventId);
  let modelToUse = ""

  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    if (!eventId) {
      throw new Error("No Event Id provided.");
    }
    if (!imageData) {
      throw new Error("No Image provided.");
    }

    if (eventDetails) {
      modelToUse = eventDetails.mlModel;
    }
    if (!eventDetails) {
      console.log("Setting Cache");
      eventDetails = await Event.findById(eventId);
      modelToUse = eventDetails.mlModel;
      eventCache.set(eventId, eventDetails, 3600);
    }

    const response = await axios.post('http://127.0.0.1:5000/countingService', { event_id: eventId, image: imageData, model: modelToUse }, config);
    const count = response.data.count;
    if (count) {
      io.to(`user:${userId}`).emit('countReceived', { count });
      const addCount = await Event.findByIdAndUpdate(eventId, { $push: { attendance: count } }, { new: true });
    }
    
    res.status(200).json({
      "message": "success"
    });

  } catch (err) {
    res.status(500).json({
      "error": err.message
    });
  }
}

exports.createEvent = (req, res) => {
  console.log("Entered createEvent function in Event controller");

  // Storing user id
  const userId = req.userId;

  // Extract details from request body
  const { name, startTime, endTime, complianceLimit, eventType } = req.body;
  console.log(name);
  console.log(startTime);
  console.log(endTime);
  console.log(complianceLimit);
  console.log(eventType)

  // Check if all required fields are provided
  if (!name || !startTime || !endTime || !complianceLimit || !eventType) {
    console.log("Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Create a new event instance with an empty attendance field
  const event = new Event({
    name,
    startTime,
    endTime,
    userId,
    complianceLimit,
    attendance: [],
    mlModel: eventType
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
    const eventData = events.map((event) => ({
      startTime: event.startTime,
      name: event.name,
      eventId: event._id,
    }));

    // Send the extracted data in the response
    res.status(200).json({ data: eventData });
  });
};

exports.eventDetails = (req, res) => {
  console.log("Entered eventDetails function in Event controller");

  const { eventId } = req.body.eventId;

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
      return res
        .status(403)
        .json({ error: "Unauthorized access to event details" });
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

  const { eventId, name, startTime, endTime, complianceLimit, attendance } =
    req.body;

  // Check if all required fields are provided
  if (
    !eventId ||
    !name ||
    !startTime ||
    !endTime ||
    !complianceLimit ||
    !attendance
  ) {
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
      return res
        .status(403)
        .json({ error: "Unauthorized access to update event" });
    }

    // Find the event by ID and update its details
    Event.findByIdAndUpdate(
      eventId,
      { name, startTime, endTime, complianceLimit, attendance },
      { new: true },
      (err, updatedEvent) => {
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
      }
    );
  });
};
