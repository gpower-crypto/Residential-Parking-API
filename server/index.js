const express = require("express");
const app = express();
const port = 3000;
const { XMLParser } = require("fast-xml-parser");
const fs = require("fs");

app.get("/", (req, res) => {
  const parser = new XMLParser({
    attributeNamePrefix: "",
    ignoreAttributes: false,
  });

  fs.readFile("./data/map.osm", function (err, data) {
    const jObj = parser.parse(data);

    // Create an empty object to store references and their counts
    const referenceCounts = {};

    // Iterate through each <way> element in the parsed JSON data
    jObj.osm.way.forEach((way) => {
      if (way.nd) {
        // Extract references from the current <way> element
        const references = way.nd.map((node) => node.ref);

        // Count the occurrences of references in the referenceCounts object
        references.forEach((ref) => {
          if (referenceCounts[ref]) {
            referenceCounts[ref]++;
          } else {
            referenceCounts[ref] = 1;
          }
        });
      }
    });

    // Filter references that occurred two or more <way> elements
    const commonReferences = Object.keys(referenceCounts).filter(
      (ref) => referenceCounts[ref] > 1
    );

    res.json(commonReferences);
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
