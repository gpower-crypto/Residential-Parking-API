const ParkingAvailability = require("./models/parkingAvailability"); // Replace with the correct path to your MapNode file
const { spawn } = require("child_process");

// Call the setupDatabase function to ensure the database and tables are created
(async () => {
  try {
    await ParkingAvailability.setupDatabase();

    // Now you can run the Python script to generate dummy data
    const pythonProcess = spawn("py", ["./storeDummyData.py"]);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`Python script stdout: ${data}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python script stderr: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        console.log("Python script completed successfully.");
      } else {
        console.error(`Python script exited with code ${code}`);
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
})();
