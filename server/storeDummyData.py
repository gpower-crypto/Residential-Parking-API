import sqlite3
import random
import numpy as np
from datetime import datetime, timedelta

# Establish a connection to the SQLite database
conn = sqlite3.connect('residential_areas.db')
cur = conn.cursor()

# SQL query to retrieve location data
sql = 'SELECT id, lat, long, area_name, residential_type FROM residential_areas;'
cur.execute(sql)
locs = cur.fetchall()

conn.close()

# Data creation
random.seed(1234)

# Create a list of unique location IDs
unique_location_ids = list(set(loc[0] for loc in locs))
random.shuffle(unique_location_ids)  # Shuffle the list for randomness

# Generate a random date within a specific date range (e.g., last 30 days)
start_date = datetime.now() - timedelta(days=30)
end_date = datetime.now()

data = []
for loc_id in unique_location_ids[:1000]:  # Limit to 1000 distinct locations
    loc = next(loc for loc in locs if loc[0] == loc_id)  # Find the corresponding location

    random_date = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))

    data.append({
        'location_id': loc_id,
        'lat': loc[1],
        'long': loc[2],
        'area_name': loc[3],
        'residential_type': loc[4],
        'date': random_date.strftime('%Y-%m-%d'),
        'dayofweek': random.randint(0, 1),  # Randomly select a day
        'hourofday': random.randint(0, 3),  # Randomly select an hour
        'available': np.random.randint(0, 10)  # Randomly generate availability
    })


# Store data in the parking_availability table
conn = sqlite3.connect("parking_availability.db")
cur = conn.cursor()

# Insert data into the parking_data table
insert_data_sql = '''
INSERT INTO parking_availability (location_id, lat, long, area_name, residential_type, date, dayofweek, hourofday, available)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
'''

cur.executemany(insert_data_sql, [(d['location_id'], d['lat'], d['long'], d['area_name'], d['residential_type'], d['date'], d['dayofweek'], d['hourofday'], d['available']) for d in data])

# Commit the changes and close the database connection
conn.commit()
conn.close()

print('Dummy data inserted into the parking_data table.')
