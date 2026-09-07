/**
 * Production-ready Structured JSON Logger
 */

const formatLog = (level, message, meta = {}) => {
    const logObject = {
        timestamp: new Date().toISOString(),
        level,
        message,
        environment: process.env.NODE_ENV || "development",
        ...meta,
    };
    return JSON.stringify(logObject);
};

export const logger = {
    info: (message, meta) => {
        console.log(formatLog("INFO", message, meta));
    },
    warn: (message, meta) => {
        console.warn(formatLog("WARN", message, meta));
    },
    error: (message, meta) => {
        console.error(formatLog("ERROR", message, meta));
    },
    debug: (message, meta) => {
        if (process.env.NODE_ENV !== "production") {
            console.log(formatLog("DEBUG", message, meta));
        }
    },
};

export default logger;
