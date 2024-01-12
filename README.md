# Residential Parking API

The Residential Parking API is tailored to assist users in finding available parking spots within residential areas. It utilizes machine learning models to predict parking spot availability based on parameters such as location, day, and time. Additionally, the API offers features to retrieve nearby residential area by implementing Dijkstra's shortest path algorithm using cached map data to optimize driving routes, reducing reliance on external mapping services and enables users to contribute real-time updates for accurate availability predictions.

## Overview

The Residential Parking API predicts parking spot availability using machine learning models. It offers functionalities to:

- **Predict Parking Availability:** Utilize machine learning to forecast available parking spots based on location, day, and time parameters.
- **Retrieve Nearby Residential Areas:** Allow users to fetch information about nearby residential areas.
- **Crowdsourced Data:** Enable users to contribute real-time updates on parking availability, enhancing prediction accuracy.
- **Database Integration:** Store parking spot, residential area, and user update data for seamless access and management.
- **Error Handling:** Gracefully handle errors to provide meaningful responses for various scenarios.

## AI Chatbot Service

The Residential Parking API includes an AI chatbot service for parking assistance. The chatbot can answer user queries related to parking locations, availability, and other relevant information.

## API Endpoints Structure

- AI chat bot - http://parking-api-LB-1578947644.us-east-1.elb.amazonaws.com:3000/parkingInfo/getParkingInfo
  
- Nearby Residential Parking Spots - http://parking-api-LB-1578947644.us-east-1.elb.amazonaws.com:3000/nearbyParking/residential_areas_nearby?latitude=${desiredLocation.latitude}&longitude=${desiredLocation.longitude}&radius=1000
  
- API call to get directions - http://parking-api-LB-1578947644.us-east-1.elb.amazonaws.com:3000/directions/getDirections?startLat=${userLocation.latitude}&startLong=${userLocation.longitude}&endLat=${selectedLocation.lat}&endLong=${selectedLocation.long}

- API request to update the availability - http://parking-api-LB-1578947644.us-east-1.elb.amazonaws.com:3000/showOrUpdate/addOrUpdateParkingAvailability?locationId=${selectedLocation.id}&available=${newAvailability}

- Fetch Parking Spot Availability http://parking-api-LB-1578947644.us-east-1.elb.amazonaws.com:3000/showOrUpdate/parking-availability?locationId=${selectedLocation.id}
  
## Technologies Used

- **Backend:** Node.js, Express.js, Python
- **Machine Learning:** scikit-learn
- **Database:** Integration with SQLite3
- **Deployment:** Using AWS services like S3, ECS, ECR, ELB
