const express = require("express");
const MapNode = require("./models/mapNodes"); // Import your MapNode class
const findShortestPath = require("./graphservice");
const { retrieveAndStoreRoadData } = require("./storeRoadData");

const app = express();
const port = 3000;

app.use(express.json());

// Define an endpoint to get directions
app.get("/getDirections", async (req, res) => {
  try {
    // Extract the start and end coordinates from the query parameters
    const { startLat, startLong, endLat, endLong } = req.query;

    // Check if all required parameters are provided
    if (!startLat || !startLong || !endLat || !endLong) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // Call the data retrieval function for both start and end points
    await retrieveAndStoreRoadData(startLat, startLong, 2000);

    // Find the closest road nodes to the start and end coordinates
    const startNodeId = await MapNode.findClosestRoadNodeId(
      parseFloat(startLat),
      parseFloat(startLong)
    );
    const endNodeId = await MapNode.findClosestRoadNodeId(
      parseFloat(endLat),
      parseFloat(endLong)
    );

    // Dijkstra's algorithm to compute the directions
    findShortestPath(startNodeId, endNodeId)
      .then((directions) => {
        console.log(directions);
        // Respond with the directions
        res.json({ directions });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
