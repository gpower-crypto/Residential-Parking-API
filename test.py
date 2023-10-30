import sys
import numpy as np
import pandas as pd
import sqlite3
from sklearn.cluster import KMeans
import random
import math

# Retrieve user input from command-line arguments
lat, long, dayofweek, hourofday = map(float, sys.argv[1:])

import os
db_path = os.path.join(os.path.dirname(__file__), "server", "map_nodes.db")
conn = sqlite3.connect(db_path)

# SQL query to retrieve location data
sql = 'SELECT id, lat, long from map_nodes;'
cur = conn.cursor()
cur.execute(sql)
locs = cur.fetchall()

# Data creation
random.seed(1234)

random_locs = list(set(random.choices(locs, k=10000)))  # Distinct locations
hours = [0, 1, 2, 3]
days = [0, 1]

data = []
for loc in random_locs:
    for hour in hours:
        for day in days:
            data.append({
                'location_id': loc[0],
                'lat': loc[1],
                'long': loc[2],
                'dayofweek': day,
                'hourofday': hour,
                'available': np.random.randint(0, 10)
            })
df = pd.DataFrame(data).sample(frac=0.95, random_state=1234)

# Fit a KMeans clustering model to the data
X = df[['lat', 'long', 'dayofweek', 'hourofday']].to_numpy()
km = KMeans(n_clusters=20).fit(X)

# Predict the cluster for the user's input data
y = np.array([[lat, long, dayofweek, hourofday]])
cy = km.predict(y)[0]

df['cluster'] = km.predict(X)
subdf = df.loc[df['cluster'] == cy]
availability = math.floor(subdf['available'].mean())

print(availability)  # Print the availability as the output
