const als = require('async-local-storage');
const { randomBytes } = require('crypto');
const logger = require('./logger');
const mongoose = require('mongoose');

// Define schema and model for request tracking
const RequestSchema = new mongoose.Schema({
    id: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    message: { type: String, required: true },
    header: { type: Object, default: {} },
    body: { type: Object, default: {} },
});

const RequestModel = mongoose.model('Request', RequestSchema);

// Enable async-local-storage
als.enable();

// Middleware function for tracking requests
const alsMiddleware = async (req, res, next) => {
    als.scope(); // Create a new scope
    const id = randomBytes(8).toString('hex'); // Generate a unique ID
    als.set('id', id); // Store ID in async-local-storage

    const header = req.headers; // Capture request headers
    const body = req.body; // Capture request body

    // Save the request ID, headers, and body to the database
    try {
        await RequestModel.create({
            id,
            message: 'Request ID generated and stored',
            header,
            body,
        });
        logger.info(`Generated and stored request ID: ${id}`, { header, body });
    } catch (error) {
        logger.error(`Failed to store request ID: ${error.message}`);
    }

    next(); // Proceed to the next middleware
};

// Helper function to retrieve the request ID
const getRequestId = () => als.get('id');

module.exports = { alsMiddleware, getRequestId };
