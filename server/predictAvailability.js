const express = require("express");
const { spawn } = require("child_process");

const app = express();
const port = 3000;

app.use(express.json());

// Define an endpoint to predict parking availability
app.get("/predictAvailability", (req, res) => {
  // Extract user input from the request
  const { lat, long, dayofweek, hourofday } = req.query;

  // Check if all required parameters are provided
  if (!lat || !long || !dayofweek || !hourofday) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // Execute the Python script with user input
  const pythonProcess = spawn("py", [
    "../test.py",
    lat.toString(),
    long.toString(),
    dayofweek.toString(),
    hourofday.toString(),
  ]);

  let predictionOutput = "";
  let errorOutput = "";

  pythonProcess.stdout.on("data", (data) => {
    predictionOutput += data;
  });

  pythonProcess.stderr.on("data", (data) => {
    errorOutput += data;
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      const availability = parseFloat(predictionOutput.trim());
      res.json({ prediction: availability });
    } else {
      console.error(`Error executing Python script. Exit code: ${code}`);
      console.error(`Python script error output: ${errorOutput}`);
      res.status(500).json({ error: "Internal server error" });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
