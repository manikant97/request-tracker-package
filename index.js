const express = require('express');
const mongoose = require('mongoose');
const { alsMiddleware, getRequestId } = require('./als');
const logger = require('./logger');

const app = express();

// Use the async-local-storage middleware
app.use(alsMiddleware);

// Middleware to parse JSON request bodies
app.use(express.json());

// MongoDB connection URI
const MONGO_URI = 'mongodb+srv://manikant2123:n4971K1h9FeDSwQ2@cluster0.bppu43r.mongodb.net/request-tracker'; 

// Connect to MongoDB using Mongoose
mongoose.connect(MONGO_URI)
    .then(() => {
        logger.info('Connected to MongoDB successfully');
    })
    .catch((error) => {
        logger.error(`Failed to connect to MongoDB: ${error.message}`);
    });

// Define Mongoose Schema and Model
const ExampleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const ExampleModel = mongoose.model('Example', ExampleSchema);

// POST route to create new data
app.post('/data', async (req, res) => {
    const requestId = getRequestId(); // Retrieve the request ID
    logger.info(`Processing POST request with ID: ${requestId}`, { 
        method: 'POST', 
        statusCode: 201,
        header: req.headers, 
        body: req.body
    });

    const { name } = req.body; // Extract data from the request body

    try {
        // Create new entry in the database
        const newData = await ExampleModel.create({ name });
        logger.info(`New data created with ID: ${newData._id}`, {
            method: 'POST',
            statusCode: 201,
            header: req.headers,
            body: req.body,
        });

        res.status(201).send({
            message: 'Data created successfully',
            requestId,
            data: newData,
        });
    } catch (error) {
        logger.error(`Error creating data: ${error.message}`, {
            method: 'POST',
            statusCode: 500,
            header: req.headers,
            body: req.body,
        });
        res.status(500).send({
            message: 'Failed to create data',
            error: error.message,
        });
    }
});

// Example GET route
app.get('/', async (req, res) => {
    const requestId = getRequestId(); // Retrieve the request ID
    logger.info(`Processing GET request with ID: ${requestId}`, { 
        method: 'GET', 
        statusCode: 200,
        header: req.headers, 
        body: req.body
    });

    try {
        const allExamples = await ExampleModel.find(); // Retrieve all entries
        res.send(`Welcome to my Express app! Your request ID: ${requestId}. Data: ${JSON.stringify(allExamples)}`);
    } catch (error) {
        logger.error(`Error retrieving data: ${error.message}`, {
            method: 'GET',
            statusCode: 500,
            header: req.headers,
            body: req.body,
        });
        res.status(500).send('An error occurred while processing your request.');
    }
});

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});
