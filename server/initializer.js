const { XMLParser } = require("fast-xml-parser");
const fs = require("fs");
const MapNode = require("./models/mapnode.js");

const parser = new XMLParser({
  attributeNamePrefix: "",
  ignoreAttributes: false,
});

fs.readFile("./data/map.osm", function (err, data) {
  const jObj = parser.parse(data);

  // Create an empty object to store references, their associated nodes, latitudes, and longitudes
  const referenceData = {};

  // Iterate through each <node> element in the parsed JSON data
  jObj.osm.node.forEach((node) => {
    const nodeRef = node["id"]; // Get the node reference
    const nodeLat = node["lat"]; // Get the latitude
    const nodeLon = node["lon"]; // Get the longitude

    // Store the reference, latitude, and longitude in the referenceData object
    referenceData[nodeRef] = {
      latitude: nodeLat,
      longitude: nodeLon,
      associatedNodes: [], // Initialize an array to store associated nodes
    };
  });

  // Iterate through each <way> element in the parsed JSON data
  jObj.osm.way.forEach((way) => {
    if (way.nd) {
      // Extract references from the current <way> element
      const references = way.nd.map((node) => node.ref);

      // Store the references in the associatedNodes array of their respective common reference
      references.forEach((ref) => {
        if (referenceData[ref]) {
          referenceData[ref].associatedNodes.push(
            ...references.filter((r) => r !== ref)
          );
        }
      });
    }
  });

  // Filter common references
  const commonReferences = Object.keys(referenceData).filter(
    (ref) => referenceData[ref].associatedNodes.length > 1
  );

  MapNode.setupDatabase()
    .then(() => {
      const bulkInsertData = commonReferences.map((ref) => {
        const { latitude, longitude, associatedNodes } = referenceData[ref];
        return {
          id: ref,
          lat: latitude,
          long: longitude,
          associatedNodes: associatedNodes,
        };
      });

      MapNode.bulkInsert(bulkInsertData)
        .then(() => {
          console.log("Bulk insert completed.");
        })
        .catch((error) => {
          console.error("Error during bulk insert:", error);
        });
    })
    .catch((error) => {
      console.error("Error setting up the database:", error);
    });
});
