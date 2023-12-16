# Residential Parking API

The Residential Parking API is tailored to assist users in finding available parking spots within residential areas. It utilizes machine learning models to predict parking spot availability based on parameters such as location, day, and time. Additionally, the API offers features to retrieve nearby residential area information and enables users to contribute real-time updates for accurate availability predictions.

## Overview

The Residential Parking API predicts parking spot availability using machine learning models. It offers functionalities to:

- **Predict Parking Availability:** Utilize machine learning to forecast available parking spots based on location, day, and time parameters.
- **Retrieve Nearby Residential Areas:** Allow users to fetch information about nearby residential areas.
- **Crowdsourced Data:** Enable users to contribute real-time updates on parking availability, enhancing prediction accuracy.
- **Database Integration:** Store parking spot, residential area, and user update data for seamless access and management.
- **Error Handling:** Gracefully handle errors to provide meaningful responses for various scenarios.

## AI Chatbot Service

The Residential Parking API includes an AI chatbot service for parking assistance. The chatbot can answer user queries related to parking locations, availability, and other relevant information.

## Technologies Used

- **Backend:** Node.js, Express.js, Python
- **Machine Learning:** scikit-learn
- **Database:** Integration with SQLite3
- **Deployment:** Using AWS services like S3, ECS, ECR, ELB
