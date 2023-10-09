const sqlite3 = require("sqlite3").verbose();

async function dijkstrasAlgorithm(start, edges, loadNodeInfo) {
  const vertices = Object.keys(edges).map(Number);
  const vertexCount = vertices.length;

  // Initialize the distance array with Infinity for all vertices
  const minDistances = {};
  vertices.forEach((vertex) => {
    minDistances[vertex] = Infinity;
  });
  minDistances[start] = 0;

  // Create a set to track visited vertices
  const visited = new Set();

  async function loadAndUpdateGraph(nodeId) {
    if (!(nodeId in loadNodeInfo && nodeId in edges)) {
      loadNodeInfo[nodeId] = await loadAssociatedNodes(nodeId);
      // Update the edges object with new neighbors
      edges[nodeId] = loadNodeInfo[nodeId].associatedNodes.map((neighbor) => {
        const weight = calculateWeight(
          loadNodeInfo[nodeId],
          loadNodeInfo[neighbor]
        );
        return [neighbor, weight];
      });
    }
  }

  // Visit all the vertices one by one
  while (visited.size !== vertexCount) {
    // Find the min vertex
    const [vertex, currentMinDist] = findVertexWithMinDist(
      minDistances,
      visited
    );

    // If we have some empty vertices in the input
    if (currentMinDist === Infinity) {
      break;
    }

    // Add the new min vertex to the list of visited vertices
    visited.add(vertex);

    // Load information about the current vertex if not already loaded
    await loadAndUpdateGraph(vertex);

    // Get the neighbors and their distances
    // console.log([vertex]);

    const neighbors = edges[vertex] || [];

    for (const [neighbor, distanceToDestination] of neighbors) {
      if (visited.has(neighbor)) {
        continue;
      }

      // Load information about the neighbor if not already loaded
      await loadAndUpdateGraph(neighbor);

      // Calculate the new path distance
      const newPath = currentMinDist + distanceToDestination;

      // Compare if the new path is smaller than the original minimum distance
      if (newPath < minDistances[neighbor]) {
        minDistances[neighbor] = newPath;
      }
    }
  }

  // Convert the distances to -1 for unreachable vertices
  const result = {};
  for (const vertex of vertices) {
    result[vertex] =
      minDistances[vertex] === Infinity ? -1 : minDistances[vertex];
  }
  return result;
}

function findVertexWithMinDist(distances, visited) {
  let currentMinDist = Infinity;
  let vertex = -1;

  // This loop will find the vertex with the minimum distance and return it
  for (const [vertexId, minDist] of Object.entries(distances)) {
    // console.log([vertexIdx, minDist]);
    const vertexIdx = Number(vertexId);

    // Skip the current iteration if the vertex has been visited
    if (visited.has(vertexIdx)) {
      continue;
    }
    if (minDist <= currentMinDist) {
      vertex = vertexIdx;
      currentMinDist = minDist;
    }
  }
  // Next minimum vertex in the minDistances array
  return [vertex, currentMinDist];
}

function calculateWeight(node1, node2) {
  if (
    node1.lat === undefined ||
    node1.long === undefined ||
    node2.lat === undefined ||
    node2.long === undefined
  ) {
    // Handle cases where lat-long information is missing for nodes
    return Infinity; // You can use Infinity to represent an unreachable node
  }

  // Calculate the Euclidean distance between two points (lat-long coordinates)
  const lat1 = node1.lat;
  const long1 = node1.long;
  const lat2 = node2.lat;
  const long2 = node2.long;

  const earthRadius = 6371; // Radius of the Earth in kilometers
  const latDiff = (lat2 - lat1) * (Math.PI / 180);
  const longDiff = (long2 - long1) * (Math.PI / 180);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(longDiff / 2) *
      Math.sin(longDiff / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Calculate the distance (weight) between the two nodes
  const distance = earthRadius * c;

  return distance;
}

async function loadAssociatedNodes(nodeId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("my_database.db");

    db.get(
      "SELECT lat, long, associatedNodes FROM map_nodes WHERE id = ?",
      [nodeId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            const { lat, long, associatedNodes } = row;
            const parsedAssociatedNodes = JSON.parse(associatedNodes);
            resolve({ lat, long, associatedNodes: parsedAssociatedNodes });
          } else {
            resolve({ lat: undefined, long: undefined, associatedNodes: [] }); // Node not found or has no associated nodes
          }
        }
        db.close();
      }
    );
  });
}

module.exports = dijkstrasAlgorithm;
