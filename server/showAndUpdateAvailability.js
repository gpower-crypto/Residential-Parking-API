const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser"); // Add this for parsing JSON in POST requests
const ParkingAvailability = require("./models/parkingAvailability");

const app = express();
const port = 4000;

// Create a database connection
const db = new sqlite3.Database("parking_availability.db");

// Use bodyParser to parse JSON in POST requests
app.use(bodyParser.json());

// Define a route to check or update parking availability
app.get("/parking-availability", (req, res) => {
  const { locationId } = req.query;

  // Check if a location ID is provided
  if (!locationId) {
    return res.status(400).json({ error: "Location ID is required." });
  }

  // Query to check parking availability based on location ID
  const query =
    "SELECT available FROM parking_availability WHERE location_id = ?";

  // Execute the query
  db.get(query, [locationId], (err, row) => {
    if (err) {
      console.error("Error querying the database:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (row) {
      // Matching record found, report availability
      res.json({ available: row.available });
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
