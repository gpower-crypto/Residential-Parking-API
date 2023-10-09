const sqlite3 = require("sqlite3").verbose();

class MapNode {
  static setupDatabase() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database("my_database.db");
      db.run(
        `CREATE TABLE IF NOT EXISTS map_nodes (
        id INTEGER PRIMARY KEY,
        lat REAL NOT NULL,
        long REAL NOT NULL,
        associatedNodes TEXT
      )
    `,
        (err) => {
          if (err) {
            console.error("Error creating table:", err.message);
          } else {
            console.log("Table created successfully");
            resolve();
          }
          // Close the database connection after the operation
          db.close();
        }
      );
    });
  }

  static async bulkInsert(nodes) {
    const db = new sqlite3.Database("my_database.db");

    return new Promise((resolve, reject) => {
      db.serialize(function () {
        db.run("BEGIN TRANSACTION");

        const insertStmt = db.prepare(
          "INSERT INTO map_nodes (id, lat, long, associatedNodes) VALUES (?, ?, ?, ?)"
        );

        let insertedCount = 0;

        // Iterate through the nodes and insert them
        nodes.forEach((node) => {
          if (node.lat !== undefined && node.long !== undefined) {
            // Ensure that lat and long are not undefined
            insertStmt.run(
              node.id,
              node.lat,
              node.long,
              JSON.stringify(node.associatedNodes)
            );
            insertedCount++;
          } else {
            console.error(
              "Skipping insertion for node with missing lat/long:",
              node
            );
          }
        });

        insertStmt.finalize();

        // Commit the transaction
        db.run("COMMIT", function (err) {
          if (err) {
            console.error("Error committing transaction:", err.message);
            reject(err.message);
          } else {
            console.log(`${insertedCount} nodes inserted successfully.`);
            resolve();
          }
          db.close();
        });
      });
    });
  }

  static get(id) {
    // Implement the method to retrieve a MapNode by ID.
  }
}

module.exports = MapNode;
