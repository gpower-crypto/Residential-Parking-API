const express = require("express");
const app = express();

// Import the ResidentialArea class and set up the database as previously defined
const ResidentialArea = require("./models/residentialArea");

// Define the /api/residential_areas/nearby endpoint
app.get("/api/residential_areas/nearby", (req, res) => {
  const { latitude, longitude, radius } = req.query;

  // Ensure the required parameters are provided
  if (!latitude || !longitude) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required parameters." });
  }

  // Use the ResidentialArea class to query the database for nearby areas
  ResidentialArea.getNearbyResidentialAreas(
    parseFloat(latitude),
    parseFloat(longitude),
    parseFloat(radius)
  )
    .then((areas) => {
      res.json({ residentialAreas: areas });
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({
        error: "An error occurred while fetching nearby residential areas.",
      });
    });
});

// Start the Express app
const port = 3000; // You can specify any port you prefer
app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});
