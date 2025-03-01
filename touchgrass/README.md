# TouchGrass
HackCU11 Project

Tech Stack:
- Frontend: React
- Backend: Node.js
- AI Service: Flask
- Database: SQL

Data Sources:
- Flowers Dataset: https://www.kaggle.com/datasets/alxmamaev/flowers-recognition/data
- TensorFlow Flowers Dataset: https://www.tensorflow.org/datasets/catalog/tf_flowers

Tutorials:
- Image Classification with MobileNetV2: https://medium.com/%40hadeelbkh/mastering-image-classification-creating-a-flower-classifier-with-mobilenetv2-and-tensorflow-a39f8b5edbf9
- Flowers from Scratch: https://github.com/GoogleCloudPlatform/training-data-analyst/blob/master/courses/machine_learning/deepdive/08_image/labs/flowers_fromscratch.ipynb

Features:
- User Account Creation
- View Posts: Your flowers and others' flowers
- Map View
- Favorite Flower Statistics

Tasks:
- Design UI: Plan and execute using React and Bootstrap
- Train Models: Flower vs. No Flower and Flower Classifier
- Set up Server & Database

Docker Compose:
This project uses Docker Compose to manage the services for the frontend, backend, AI service, and database. Each service is defined in the `docker-compose.yml` file, specifying how to build and connect them.