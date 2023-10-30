const sqlite3 = require("sqlite3").verbose();

class ParkingAvailability {
  static setupDatabase() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database("parking_availability.db");
      db.run(
        `CREATE TABLE IF NOT EXISTS parking_availability (
          id INTEGER PRIMARY KEY,
          location_id INTEGER,
          lat REAL NOT NULL,
          long REAL NOT NULL,
          area_name TEXT,
          residential_type TEXT,
          date DATE,
          dayofweek INTEGER,
          hourofday INTEGER,
          available INTEGER
        )`,
        (err) => {
          if (err) {
            console.error("Error creating table:", err.message);
            reject(err.message);
          } else {
            console.log("Table created successfully");
            resolve();
          }
          db.close();
        }
      );
    });
  }
  static addOrUpdateParkingAvailability(locationId, available) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database("parking_availability.db");
      const dbResidential = new sqlite3.Database("residential_areas.db");

      // Calculate the current date
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // Months are 0-indexed
      const day = currentDate.getDate();

      // Calculate the day of the week (0 for Sunday, 1 for Monday, and so on)
      const dayOfWeek = currentDate.getDay();

      // Calculate the hour of the day (0 for midnight to 3 for 9 PM to 11:59 PM)
      const hourOfDay = Math.floor(currentDate.getHours() / 6);

      // Fetch additional information from the residential_areas table
      dbResidential.get(
        "SELECT lat, long, area_name, residential_type FROM residential_areas WHERE id = ?",
        [locationId],
        (err, row) => {
          if (err) {
            console.error("Error querying the database:", err.message);
            reject(err.message);
            dbResidential.close(); // Close the database connection in case of an error
            return;
          }

          if (!row) {
            reject("Location ID not found in residential areas");
            dbResidential.close(); // Close the database connection
            return;
          }

          // Extract relevant information
          const { lat, long, area_name, residential_type } = row;

          // Check if the record already exists
          const query =
            "SELECT available FROM parking_availability WHERE location_id = ?";
          db.get(query, [locationId], (err, row) => {
            if (err) {
              console.error("Error querying the database:", err.message);
              reject(err.message);
              db.close(); // Close the database connection
              return;
            }

            if (row) {
              // Record already exists, update availability
              const updateQuery =
                "UPDATE parking_availability SET available = ? WHERE location_id = ?";
              db.run(updateQuery, [available, locationId], (err) => {
                if (err) {
                  console.error("Error updating availability:", err.message);
                  reject(err.message);
                }
                resolve("Parking availability updated successfully.");
                db.close(); // Close the database connection
              });
            } else {
              // Record doesn't exist, insert a new record
              const insertQuery =
                "INSERT INTO parking_availability (location_id, lat, long, area_name, residential_type, date, dayofweek, hourofday, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
              db.run(
                insertQuery,
                [
                  locationId,
                  lat,
                  long,
                  area_name,
                  residential_type,
                  `${year}/${month}/${day}`,
                  dayOfWeek,
                  hourOfDay,
                  available,
                ],
                (err) => {
                  if (err) {
                    console.error("Error inserting availability:", err.message);
                    reject(err.message);
                  }
                  resolve("New parking availability added successfully.");
                  db.close(); // Close the database connection
                }
              );
            }
          });
        }
      );
    });
  }

  static async checkAndUpdatePredictions(
    locationId,
    thresholdDays,
    newAvailability
  ) {
    // Implement prediction algorithm and update availability
  }
}

module.exports = ParkingAvailability;
