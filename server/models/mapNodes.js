const sqlite3 = require("sqlite3").verbose();
const haversine = require("haversine-distance");

class MapNode {
  static setupDatabase() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database("map_nodes.db");
      db.run(
        `CREATE TABLE IF NOT EXISTS map_nodes (
          id INTEGER PRIMARY KEY,
          lat REAL NOT NULL,
          long REAL NOT NULL,
          associatedNodes TEXT
        )`,
        (err) => {
          if (err) {
            console.error("Error creating table:", err.message);
          } else {
            console.log("Table created successfully");
            resolve();
          }
          db.close();
        }
      );
    });
  }

  static createIndexes() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database("map_nodes.db");

      db.run("CREATE INDEX IF NOT EXISTS idx_lat ON map_nodes (lat)", (err) => {
        if (err) {
          console.error("Error creating index on 'lat':", err.message);
          reject(err.message);
        }
      });

      db.run(
        "CREATE INDEX IF NOT EXISTS idx_long ON map_nodes (long)",
        (err) => {
          if (err) {
            console.error("Error creating index on 'long':", err.message);
            reject(err.message);
          }
        }
      );

      db.run(
        "CREATE INDEX IF NOT EXISTS idx_associatedNodes ON map_nodes (associatedNodes)",
        (err) => {
          if (err) {
            console.error(
              "Error creating index on 'associatedNodes':",
              err.message
            );
            reject(err.message);
          }
        }
      );

      db.close((err) => {
        if (err) {
          console.error("Error closing database:", err.message);
          reject(err.message);
        }
        resolve();
      });
    });
  }

  static async bulkInsert(nodes) {
    const db = new sqlite3.Database("map_nodes.db");

    return new Promise((resolve, reject) => {
      db.serialize(function () {
        db.run("BEGIN TRANSACTION");

        let insertedCount = 0;
        let updateCount = 0;
        let skippedCount = 0;

        nodes.forEach((node) => {
          if (node.id !== undefined) {
            // Check if a record with the same ID already exists
            db.get(
              "SELECT * FROM map_nodes WHERE id = ?",
              [node.id],
              (err, row) => {
                if (err) {
                  console.error(
                    "Error checking for existing record:",
                    err.message
                  );
                  reject(err.message);
                  return;
                }

                if (row) {
                  // Merge the associated nodes with the existing record
                  const existingNodes = new Set(
                    JSON.parse(row.associatedNodes)
                  );
                  const newNodes = new Set(node.associatedNodes);
                  const updatedNodes = Array.from(
                    new Set([...existingNodes, ...newNodes])
                  );

                  db.run(
                    "UPDATE map_nodes SET associatedNodes = ? WHERE id = ?",
                    [JSON.stringify(updatedNodes), node.id],
                    function (err) {
                      if (err) {
                        console.error("Error updating record:", err.message);
                        reject(err.message);
                      } else {
                        updateCount++;
                        checkCounts();
                      }
                    }
                  );
                } else {
                  // Insert a new record
                  const insertStmt = db.prepare(
                    "INSERT INTO map_nodes (id, lat, long, associatedNodes) VALUES (?, ?, ?, ?)"
                  );

                  insertStmt.run(
                    node.id,
                    node.lat,
                    node.long,
                    JSON.stringify(node.associatedNodes),
                    function (err) {
                      if (err) {
                        console.error("Error inserting record:", err.message);
                        reject(err.message);
                      } else {
                        insertedCount++;
                        checkCounts();
                      }
                    }
                  );

                  insertStmt.finalize();
                }
              }
            );
          } else {
            console.error("Skipping insertion for node with missing ID:", node);
            skippedCount++;
            checkCounts();
          }
        });

        function checkCounts() {
          const totalCount = insertedCount + updateCount + skippedCount;
          if (totalCount === nodes.length) {
            console.log(
              `${insertedCount} nodes inserted, ${updateCount} nodes updated, and ${skippedCount} nodes skipped.`
            );
            db.run("COMMIT", function (err) {
              if (err) {
                console.error("Error committing transaction:", err.message);
                reject(err.message);
              } else {
                resolve();
              }
              db.close();
            });
          }
        }
      });
    });
  }

  static findClosestRoadNodeId(lat, long) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database("map_nodes.db");
      db.serialize(function () {
        // Retrieve all road nodes from the database
        db.all("SELECT id, lat, long FROM map_nodes", (err, rows) => {
          if (err) {
            console.error("Error querying the database:", err.message);
            reject(err.message);
          } else {
            let closestNodeId = null;
            let minDistance = Infinity;

            // Calculate the distance to each road node
            rows.forEach((row) => {
              const nodeLat = row.lat;
              const nodeLong = row.long;
              const distance = haversine(
                { lat, lon: long },
                { lat: nodeLat, lon: nodeLong }
              );

              if (distance < minDistance) {
                minDistance = distance;
                closestNodeId = row.id;
              }
            });

            if (closestNodeId !== null) {
              resolve(closestNodeId);
            } else {
              reject("No matching road node found in the database");
            }
          }
        });
      });
      db.close();
    });
  }
}

module.exports = MapNode;
