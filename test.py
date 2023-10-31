import sys
import numpy as np
import pandas as pd
import sqlite3
from sklearn.cluster import KMeans
import os

# Retrieve user input from command-line arguments
lat, long, dayofweek, hourofday = map(float, sys.argv[1:])

db_path = os.path.join(os.path.dirname(__file__),
                       "server", "parking_availability.db")
conn = sqlite3.connect(db_path)

# Fit a KMeans clustering model to the data
all_data_sql = 'SELECT lat, long, dayofweek, hourofday, available FROM parking_availability;'
all_data = pd.read_sql_query(all_data_sql, conn)
X = all_data[['lat', 'long', 'dayofweek', 'hourofday']].to_numpy()
km = KMeans(n_clusters=20, n_init=10).fit(X)

# Predict the cluster for the user's input data
user_cluster = km.predict([[lat, long, dayofweek, hourofday]])[0]

# Add the 'cluster' column to the DataFrame
all_data['cluster'] = km.labels_

subdf = all_data[all_data['cluster'] == user_cluster]
availability = int(round(subdf['available'].mean()))

print(availability)
