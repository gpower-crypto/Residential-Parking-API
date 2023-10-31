const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser"); // Add this for parsing JSON in POST requests
const ParkingAvailability = require("./models/parkingAvailability");
const fetch = require("node-fetch");

const app = express();
const port = 4001;

// Create a database connection
const db = new sqlite3.Database("parking_availability.db");

// Use bodyParser to parse JSON in POST requests
app.use(bodyParser.json());

// Define a route to check or update parking availability
app.get("/parking-availability", async (req, res) => {
  const { locationId } = req.query;

  // Check if a location ID is provided
  if (!locationId) {
    return res.status(400).json({ error: "Location ID is required." });
  }

  // Function to check if the past date of availability is greater than one day
  const isPastDateGreaterThanOneDay = (pastDate) => {
    const currentDate = new Date();
    const pastDateObj = new Date(pastDate);
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // 24 hours
    return currentDate - pastDateObj > oneDayInMilliseconds;
  };

  // Function to calculate dayofweek and hourofday
  const calculateDayAndHour = () => {
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const hourOfDay = Math.floor(currentDate.getHours() / 6);
    return { dayOfWeek, hourOfDay };
  };

  // Query to check parking availability based on location ID
  const query =
    "SELECT available, date, lat, long, dayofweek, hourofday FROM parking_availability WHERE location_id = ?";

  // Execute the query
  db.get(query, [locationId], async (err, row) => {
    if (err) {
      console.error("Error querying the database:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (row) {
      // Matching record found, check if past date is greater than one day
      const { date, lat, long } = row;
      if (isPastDateGreaterThanOneDay(date)) {
        // Past date is greater than one day, make an API call to predict availability
        const { dayOfWeek, hourOfDay } = calculateDayAndHour();

        try {
          const apiUrl = `http://localhost:3000/predictAvailability?lat=${lat}&long=${long}&dayofweek=${dayOfWeek}&hourofday=${hourOfDay}`;

          const response = await fetch(apiUrl, {
            method: "GET",
          });

          if (!response.ok) {
            console.error("Error predicting parking availability");
            return res.status(500).json({
              error: "Internal server error while predicting availability",
            });
          }

          const predictedAvailability = await response.json();

          res.json({
            available: row.available,
            predictedAvailability: predictedAvailability.prediction,
            date: date,
          });
        } catch (error) {
          console.error("Error predicting parking availability:", error);
          return res.status(500).json({
            error: "Internal server error while predicting availability",
          });
        }
      } else {
        // Past date is within one day, report the stored availability
        res.json({ available: row.available, date: date });
      }
    } else {
      // No availability data found for the provided location ID
      res.json({
        message: "No parking availability data available for this location.",
      });
    }
  });
});

app.post("/addOrUpdateParkingAvailability", (req, res) => {
  const { locationId, available } = req.query;

  // Call the method to add or update parking availability in the database
  ParkingAvailability.addOrUpdateParkingAvailability(locationId, available)
    .then((response) => {
      res.json({ message: response });
    })
    .catch((error) => {
      res.status(500).json({ error: error });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
