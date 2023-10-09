import numpy as np
import pandas as pd
import sqlite3
import random
from sklearn.cluster import KMeans

conn = sqlite3.connect("./server/my_database.db")
# sql = """create table map_parking_spots(
# 	id integer not null primary key autoincrement,
# 	location_id int not null,
# 	dayofweek int not null,   -- 0 or 1
# 	hourofday int not null,   -- 0, 1, 2, 3
# 	available int not null default 0,
# 	foreign key (location_id) references map_nodes(id)
# );
# """

# cur = conn.cursor()
# cur.execute(sql)
# conn.commit()

sql = 'SELECT id, lat, long from map_nodes;'
cur = conn.cursor()
cur.execute(sql)
locs = cur.fetchall()



# data creation
random.seed(1234)
random_locs = list(set(random.choices(locs, k = 10000)))   # distinct locations
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
df = pd.DataFrame(data).sample(frac = 0.95, random_state=1234)
# print(df)

# Step: Insert this dataframe into new table
# https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_sql.html

# https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html


X = df[['lat', 'long', 'dayofweek', 'hourofday']].to_numpy()
km = KMeans(n_clusters=20).fit(X)

y = np.array([[1.36, 103.76, 0, 1]])   # data getting from user
cy = km.predict(y)[0]
print(f"Cluster of test data point: {cy}")

df['cluster'] = km.predict(X)
subdf = df.loc[df['cluster'] == cy]
availabity = subdf['available'].mean()

print(df)
print(subdf)
print(f"Test data group mean: {availabity}")
print(f"Parking available at test point: {np.round(availabity)}")







