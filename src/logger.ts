import * as logger from 'winston';

logger.configure({
  level: process.env.LOG_LEVEL || 'debug',
  transports: [
    new logger.transports.Console({
      colorize: true,
      timestamp: true
    })
  ]
});

logger.addColors({
  error: 'red',
  warn: 'yellow',
  debug: 'blue',
  info: 'green'
});

export {logger as Logger};
