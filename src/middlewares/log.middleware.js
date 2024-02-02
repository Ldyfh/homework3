import winston from 'winston';

const logger = winston.createLogger({
    level: 'info', // error, warn
    format: winston.format.json(),
    transports: [
        new winston.transports.Console()
    ]
});

export default function(req, res, next) {
    const start = new Date().getTime();

    res.on('finish', () => {
        const duration = new Date().getTime() - start;
        logger.info(`Methoid: ${req.method}, URL: ${req.url}, Status: ${res.statusCode}, Duration: ${duration}ms`);

    });

    next();

}
