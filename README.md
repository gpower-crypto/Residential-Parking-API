# Residential Parking API

The Residential Parking API is designed to assist users in finding available parking spots within residential areas. It leverages machine learning models to predict parking spot availability based on various parameters, offering features to retrieve nearby residential area information and allowing real-time updates for accurate availability predictions.

## Overview

The Residential Parking API predicts parking spot availability using machine learning models. It offers functionalities to:

- Predict Parking Availability: Utilize machine learning to forecast available parking spots based on location, day, and time parameters.
- Retrieve Nearby Residential Areas: Allow users to fetch information about nearby residential areas.
- Crowdsourced Data: Enable users to contribute real-time updates on parking availability, enhancing prediction accuracy.
- Database Integration: Store parking spot, residential area, and user update data for seamless access and management.
- Error Handling: Gracefully handle errors to provide meaningful responses for various scenarios.

## Technologies Used

- **Backend**: Node.js, Express.js, Python
- **Machine Learning**: sklearn
- **Database**: Integration with SQLite3
- **Deployment**: Using AWS services like S3, ECS, ECR, ELB

