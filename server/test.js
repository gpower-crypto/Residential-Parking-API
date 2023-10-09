const sqlite3 = require("sqlite3").verbose();

/* 
    {
  "start": 1,
  "edges": [
    [[1, 2]],
    [[0, 1]],
    [[3, 1]],
    [[2, 2]]
    ]
}
*/

async function loadAssociatedNodes(nodeId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("my_database.db");

    db.get(
      "SELECT associatedNodes FROM map_nodes WHERE id = ?",
      [nodeId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            const { associatedNodes } = row;
            const parsedAssociatedNodes = JSON.parse(associatedNodes);
            resolve(parsedAssociatedNodes);
          } else {
            resolve({ associatedNodes: [] }); // Node not found or has no associated nodes
          }
        }
        db.close();
      }
    );
  });
}

async function loadLatLong(nodeId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("my_database.db");

    db.get(
      "SELECT lat, long FROM map_nodes WHERE id = ?",
      [nodeId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            const { lat, long } = row;
            resolve({ lat, long });
          } else {
            resolve({ associatedNodes: [] }); // Node not found or has no associated nodes
          }
        }
        db.close();
      }
    );
  });
}

async function dijkstrasAlgorithm(start, end) {
  const vertices = 15660; // fixed number of vertices

  // store the min distance from the source or start node
  let minDistances = {}; // if it is not present, then infinity
  let minPaths = {};
  minDistances[start] = 0;
  minPaths[start] = [start];

  // will store all the nodes that have been visited
  const visited = new Set();

  // visit all the vertices one by one
  while (visited.size != vertices || visited.has(end)) {
    console.log(visited.size);

    // find the min vertex
    let [vertex, currentMinDist] = findVertexWithMinDist(minDistances, visited);

    // if we have some empty vertices in the input
    if (currentMinDist === Infinity) {
      break;
    }

    // add the new min vertex to the list of visited vertices
    visited.add(vertex);

    // for each of the neighabouring vertices
    const associated = await loadAssociatedNodes(vertex);
    const vertexPos = await loadLatLong(vertex);
    for (const destination of associated) {
      const destinationPos = await loadLatLong(destination);
      const distanceToDestination = Math.pow(
        Math.pow(vertexPos.lat - destinationPos.lat, 2) +
          Math.pow(vertexPos.long - destinationPos.long, 2),
        0.5
      );

      if (visited.has(destination)) {
        continue;
      }
      // currentMinDist is for the main vertex,
      // distanceToDestination is the distance to the neighabouring vertex
      const newPath = currentMinDist + distanceToDestination;
      // current min distance in minDistances array
      const currentDestinationPath = minDistances?.[destination] ?? Infinity;
      // compare if the new path is smaller than the original minimum distance
      if (newPath < currentDestinationPath) {
        minDistances[destination] = newPath;
        minPaths[destination] = minPaths[vertex] + [destination];
      }
    }
  }
  return {
    distance: minDistances?.[end] ?? Infinity,
    path: minPaths?.[end] ?? [],
  };
}

function findVertexWithMinDist(distances, visited) {
  let currentMinDist = Infinity;
  let vertex = -1;

  // this loop will find the vertex with the minimum distance and return it
  for (const vertexIdx of Object.keys(distances)) {
    // skip the current iteration if the vertex has been visited
    if (visited.has(vertexIdx)) {
      continue;
    }
    if (distances[vertexIdx] <= currentMinDist) {
      vertex = vertexIdx;
      currentMinDist = distances[vertexIdx];
    }
  }

  // next minimum vetex in the minDistances array
  return [vertex, currentMinDist];
}

const startNodeId = 6895934621; // Replace with the actual start node ID
const endNodeId = 139671206; // Replace with the actual end node ID
dijkstrasAlgorithm(startNodeId, endNodeId).then((val) => console.log(val));
