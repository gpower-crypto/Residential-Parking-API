const fetch = require("node-fetch");
const { XMLParser } = require("fast-xml-parser");
const MapNode = require("./models/mapNodes");

const parser = new XMLParser({
  attributeNamePrefix: "",
  ignoreAttributes: false,
});

// const userLat = 1.330151; // Replace with the user's entered latitude
// const userLong = 103.899753; // Replace with the user's entered longitude
// const distance = 2000; // The radius around the user's location

async function retrieveAndStoreRoadData(lat, long, distance) {
  const overpassQuery = `
    [out:xml];
    (
      way["highway"](around:${distance}, ${lat}, ${long});
      node(w)->.n;
    );
    out center;
  `;

  const apiUrl = "https://overpass-api.de/api/interpreter";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      body: overpassQuery,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const xmlData = await response.text();
    const jsonObj = parser.parse(xmlData, { ignoreAttributes: false });

    const referenceData = {};

    // Iterate through each node in the response
    if (jsonObj.osm.way && jsonObj.osm.way.length) {
      jsonObj.osm.way.forEach((way) => {
        if (way.nd) {
          const references = way.nd.map((node) => node.ref);
          references.forEach((ref) => {
            if (!referenceData[ref]) {
              referenceData[ref] = {
                latitude: null,
                longitude: null,
                associatedNodes: [],
              };
            }
            referenceData[ref].associatedNodes.push(
              ...references.filter((r) => r !== ref)
            );
          });
        }
      });
    }

    if (jsonObj.osm.node && jsonObj.osm.node.length) {
      jsonObj.osm.node.forEach((node) => {
        const nodeRef = node.id;
        const nodeLat = node.lat;
        const nodeLon = node.lon;
        if (referenceData[nodeRef]) {
          referenceData[nodeRef].latitude = nodeLat;
          referenceData[nodeRef].longitude = nodeLon;
        }
      });
    }

    const commonReferences = Object.keys(referenceData).filter(
      (ref) => referenceData[ref].associatedNodes.length > 1
    );

    await MapNode.setupDatabase();
    await MapNode.createIndexes();

    const bulkInsertData = commonReferences.map((ref) => {
      const { latitude, longitude, associatedNodes } = referenceData[ref];
      return {
        id: ref,
        lat: latitude,
        long: longitude,
        associatedNodes: associatedNodes,
      };
    });

    await MapNode.bulkInsert(bulkInsertData);
  } catch (error) {
    console.error("Error:", error);
  }
}

module.exports = { retrieveAndStoreRoadData };
