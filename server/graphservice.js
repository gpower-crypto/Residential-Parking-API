const sqlite3 = require("sqlite3").verbose();

// Integration of dijkstrasAlgorithm

async function dijkstrasAlgorithm(start, edges, loadNodeInfo) {
  var vertices = Object.keys(edges).map(Number);
  var vertexCount = vertices.length;

  // Initialize the distance array with Infinity for all vertices
  const minDistances = {};
  vertices.forEach((vertex) => {
    minDistances[vertex] = Infinity;
  });
  minDistances[start] = 0;

  const minPaths = {};
  vertices.forEach((vertex) => {
    minPaths[vertex] = [];
  });

  minPaths[start] = [start];

  // Create a set to track visited vertices
  const visited = new Set();

  async function loadAndUpdateGraph(nodeId) {
    if (!(nodeId in loadNodeInfo)) {
      loadNodeInfo[nodeId] = await loadAssociatedNodes(nodeId);
    }

    await Promise.all(
      loadNodeInfo[nodeId].associatedNodes.map(async (neighbor) => {
        if (!(neighbor in loadNodeInfo)) {
          const targetNode = await loadAssociatedNodes(neighbor);
          loadNodeInfo[neighbor] = targetNode;
        }
      })
    );

    if (!(nodeId in edges) || (nodeId in edges && edges[nodeId] != [])) {
      edges[nodeId] = loadNodeInfo[nodeId].associatedNodes.map((neighbor) => {
        const weight = calculateWeight(
          loadNodeInfo[nodeId],
          loadNodeInfo[neighbor]
        );
        return [neighbor, weight];
      });

      // Initialize minimum distances and paths for newly added nodes
      loadNodeInfo[nodeId].associatedNodes.forEach((neighbor) => {
        if (!(neighbor in minDistances)) {
          minDistances[neighbor] = Infinity;
        }
        if (!(neighbor in minPaths)) {
          minPaths[neighbor] = [];
        }
      });

      vertices = Object.keys(edges).map(Number);
      vertexCount = vertices.length;
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
    console.log(vertexCount);

    // Load information about the current vertex if not already loaded
    await loadAndUpdateGraph(vertex);

    // Get the neighbors and their distances
    const neighbors = edges[vertex];

    for (const [neighbor, distanceToDestination] of neighbors) {
      if (visited.has(neighbor)) {
        continue;
      }

      // Load information about the neighbor if not already loaded
      // await loadAndUpdateGraph(neighbor);

      // Calculate the new path distance
      const newPath = currentMinDist + distanceToDestination;

      // Compare if the new path is smaller than the original minimum distance
      if (newPath < minDistances[neighbor]) {
        minDistances[neighbor] = newPath;
        minPaths[neighbor] = [...minPaths[vertex], neighbor];
      }
    }
  }

  // Convert the distances to -1 for unreachable vertices
  const result = {};
  for (const vertex of vertices) {
    result[vertex] = {
      distance: minDistances[vertex] === Infinity ? -1 : minDistances[vertex],
      path: minPaths[vertex],
    };
  }
  return result;
}

function findVertexWithMinDist(distances, visited) {
  let currentMinDist = Infinity;
  let vertex = -1;

  // This loop will find the vertex with the minimum distance and return it
  for (const [vertexId, minDist] of Object.entries(distances)) {
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

// Function to load associated nodes with lat-long coordinates from the database
async function loadAssociatedNodes(nodeId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("map_nodes.db");

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

// Function to calculate the weight between two nodes based on lat-long coordinates
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

async function findShortestPath(startNodeId, endNodeId) {
  const { graph, loadNodeInfo } = await createGraph(startNodeId, endNodeId);

  try {
    const shortestPath = await dijkstrasAlgorithm(
      startNodeId,
      graph,
      loadNodeInfo
    );
    console.log(startNodeId, endNodeId);

    !shortestPath[endNodeId];
    shortestDistance = shortestPath[endNodeId].path;
    let nodeArr = [];

    console.log(
      `Shortest distance from node ${startNodeId} to ${endNodeId}: ${shortestDistance}`
    );

    shortestDistance.map((node) => {
      nodeArr.push({
        latitude: loadNodeInfo[node].lat,
        longitude: loadNodeInfo[node].long,
      });
    });

    // console.log(nodeArr);
    return nodeArr;
  } catch (error) {
    console.log(
      error,
      `Could not find path from node ${startNodeId} to ${endNodeId}`
    );
  }
}

// Create a dictionary to store loaded node information
const loadNodeInfo = {};

async function createGraph(startNodeId, endNodeId) {
  const startNode = await loadAssociatedNodes(startNodeId);
  const endNode = await loadAssociatedNodes(endNodeId);

  const graph = {};

  async function addNodeToGraph(nodeId) {
    if (!graph[nodeId]) {
      const node = await loadAssociatedNodes(nodeId);
      graph[nodeId] = [];
    }
  }

  await Promise.all(
    startNode.associatedNodes
      .concat(endNode.associatedNodes)
      .map(addNodeToGraph)
  );

  // Load information about start and end nodes if not already loaded
  if (!(startNodeId in loadNodeInfo)) {
    loadNodeInfo[startNodeId] = startNode;
  }
  if (!(endNodeId in loadNodeInfo)) {
    loadNodeInfo[endNodeId] = endNode;
  }

  await Promise.all(
    startNode.associatedNodes.map(async (nodeId) => {
      const associatedNode = await loadAssociatedNodes(nodeId);
      if (!(nodeId in loadNodeInfo)) {
        loadNodeInfo[nodeId] = associatedNode;
      }
      await Promise.all(
        associatedNode.associatedNodes.map(async (associatedNodeId) => {
          if (!(associatedNodeId in loadNodeInfo)) {
            const targetNode = await loadAssociatedNodes(associatedNodeId);
            loadNodeInfo[associatedNodeId] = targetNode;
          }
          const weight = calculateWeight(
            loadNodeInfo[nodeId],
            loadNodeInfo[associatedNodeId]
          );
          graph[nodeId].push([Number(associatedNodeId), weight]);
        })
      );
    })
  );

  return { graph, loadNodeInfo };
}

// const startNodeId = 139671182; // Replace with the actual start node ID
// const endNodeId = 4726301690; // Replace with the actual end node ID

// findShortestPath(startNodeId, endNodeId)
//   .then((shortestDistance) => {
//     console.log(
//       `Shortest distance from node ${startNodeId} to ${endNodeId}: ${shortestDistance}`
//     );
//     let nodeArr = [];
//     shortestDistance.map((node) => {
//       nodeArr.push({
//         latitude: loadNodeInfo[node].lat,
//         longitude: loadNodeInfo[node].long,
//       });
//     });
//     return nodeArr;
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });

// Export the dijkstrasAlgorithm function
module.exports = findShortestPath;
