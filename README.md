# Backend Server (EAT with AI)

## Overview
This is the backend repository for the Event Attendance Tracking application. The goal of the project is to count the number of people in an event in real time. This repository sets up the CRUD routes, and other api endpoints.   
Tech Stack:
- Node.js
- Express.js
- MongoDB

## Setup Instructions
To successfully setup the backend locally, please install the following:   
- [Node.js](https://nodejs.org/en/download)
- [MongoDB Compass](https://www.mongodb.com/try/download/compass)

First, `git clone` this repository to access all the code.   
Then, to install all the dependencies run `npm install`.

Also, create `.env` file. It will contain the the `DBCONFIG=` parameter. The value for it can be accessed using your MongoDB account.   

## Configuration
`fix me`

## Running the application
To run the application, use `npm start`.

## Usage
POST /api/event/event-details   
Body : {event-id}    
Return 200 { start-time, end-time, compliance-limit, name, event-id, mlModel}
or
Return 400 { error : `error`}

Example:    
Body: {
    event-id: "a_dummy_event_id"
}   
Response:    
{  
    start-time: `starting time`   
    end-time: `ending time`   
    compliance-limit: `a user provided number`     
    name: `event name`    
    event-id: `eventId`   
    mlModel: `dense | sparse`  
}