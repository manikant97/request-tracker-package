const winston = require('winston');
const mongoose = require('mongoose');

// Define Mongoose schema for logs
const LogSchema = new mongoose.Schema({
    id: { type: String, required: true },
    timestamp: { type: Date, required: true },
    level: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: Object, default: {} },
    method: { type: String, default: 'N/A' },
    statusCode: { type: Number, default: null },
});

// Create a Mongoose model for logs
const LogModel = mongoose.model('Log', LogSchema);

// Define custom Winston transport to save logs to MongoDB
class MongoDBTransport extends winston.Transport {
    log(info, callback) {
        const logEntry = {
            id: Math.random().toString(36).substring(2, 15),
            timestamp: new Date(info.timestamp),
            level: info.level,
            message: info.message,
            metadata: info.metadata || {},
            method: info.method || 'N/A',
            statusCode: info.statusCode || null,
        };

        // Save log entry to MongoDB
        LogModel.create(logEntry)
            .then(() => callback())
            .catch((error) => {
                console.error(`Error saving log to MongoDB: ${error.message}`);
                callback(error);
            });
    }
}

// Create Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, metadata, ...rest }) => {
            // If header and body are included in metadata, extract and restructure them
            const { header, body, ...remainingMetadata } = metadata || {};

            return JSON.stringify({
                Header: header || 'Log Entry',
                id: Math.random().toString(36).substring(2, 15),
                timestamp,
                level,
                message,
                metadata: {
                    header: header || {},
                    body: body || {},
                    ...remainingMetadata, // Include other metadata fields
                },
                method: rest.method || 'N/A',
                statusCode: rest.statusCode || 'N/A',
            });
        })
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        new MongoDBTransport(), // Save logs to MongoDB
        new winston.transports.File({ filename: 'app.log', level: 'info' }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
    ],
});

// Add console logging for non-production environments
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// Example usage
logger.info('This is an info message', { metadata: { header: { key: 'value' }, body: { detail: 'Some details' } }, method: 'GET', statusCode: 200 });
logger.error('This is an error message', { metadata: { header: { error: 'Something went wrong' }, body: { errorDetails: 'Detailed error message' } }, method: 'POST', statusCode: 500 });

module.exports = logger;
