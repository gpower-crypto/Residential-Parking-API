const sqlite3 = require("sqlite3").verbose();
const haversine = require("haversine-distance");

class ResidentialArea {
  static setupDatabase() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database("residential_areas.db");
      db.run(
        `CREATE TABLE IF NOT EXISTS residential_areas (
          id INTEGER PRIMARY KEY,
          lat REAL NOT NULL,
          long REAL NOT NULL,
          area_name TEXT,
          landuse TEXT,
          residential_type TEXT,
          source TEXT
        )
        `,
        (err) => {
          if (err) {
            console.error("Error creating table:", err.message);
            reject(err.message);
          } else {
            console.log("Table created successfully");
            resolve();
          }
        }
      );
      db.close(); // Close the database connection after the operation
    });
  }

  static async bulkInsert(areas) {
    const db = new sqlite3.Database("residential_areas.db");

    return new Promise((resolve, reject) => {
      db.serialize(function () {
        db.run("BEGIN TRANSACTION");

        const insertStmt = db.prepare(
          "INSERT INTO residential_areas (id, lat, long, area_name, landuse, residential_type, source) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );

        let insertedCount = 0;

        // Iterate through the residential areas and insert them
        areas.forEach((area) => {
          if (
            area.center &&
            area.center.lat !== undefined &&
            area.center.lon !== undefined
          ) {
            // Ensure that lat and long are not undefined
            insertStmt.run(
              area.id,
              area.center.lat,
              area.center.lon,
              area.tags.name || "Unknown",
              area.tags.landuse || "Unknown",
              area.tags.residential || "Unknown",
              "Overpass API"
            );
            insertedCount++;
          } else {
            console.error(
              "Skipping insertion for area with missing lat/long:",
              area
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
            console.log(`${insertedCount} areas inserted successfully.`);
            resolve();
          }
        });

        db.close(); // Close the database connection after all operations are completed
      });
    });
  }

  static getNearbyResidentialAreas(latitude, longitude, radius) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database("residential_areas.db");

      // Define the SQL query to retrieve all residential areas
      const sql = `SELECT * FROM residential_areas`;

      db.all(sql, [], (err, rows) => {
        if (err) {
          db.close();
          return reject(err);
        }

        // Calculate the distance and filter nearby residential areas
        const nearbyAreas = rows.filter((area) => {
          const distance = haversine(
            { lat: latitude, lng: longitude },
            { lat: area.lat, lng: area.long }
          );

          return distance <= radius * 1000;
        });

        db.close();
        resolve(nearbyAreas);
      });
    });
  }
}

module.exports = ResidentialArea;
