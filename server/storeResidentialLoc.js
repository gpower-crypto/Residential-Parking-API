const fetch = require("node-fetch"); // If you're running this on Node.js
const ResidentialArea = require("./models/residentialArea"); // Import the ResidentialArea class

// Define the Overpass API query
const overpassQuery = `
[out:json];
area["name"="Singapore"]->.a;
(way(area.a)["landuse"="residential"];);
out center;
`;

const apiUrl = "https://overpass-api.de/api/interpreter"; // Overpass API endpoint

// Step 1: Set up the database for residential areas
ResidentialArea.setupDatabase()
  .then(() => {
    // Step 2: Fetch data from Overpass API
    return fetch(apiUrl, {
      method: "POST",
      body: overpassQuery, // Send the Overpass query as the request body
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  })
  .then((response) => response.json())
  .then((data) => {
    // Step 3: Insert the data into the database
    const residentialAreas = data.elements;
    return ResidentialArea.bulkInsert(residentialAreas);
  })
  .then(() => {
    console.log("Residential areas data inserted into the database.");
  })
  .catch((error) => {
    console.error("Error:", error);
  });
