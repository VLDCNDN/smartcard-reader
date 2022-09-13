/**
 * Configurations of logger.
 */
 const winston = require("winston");
 const winstonRotator = require("winston-daily-rotate-file");
 const { combine, splat, timestamp, printf } = winston.format;
 
 const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
   let msg = `${timestamp} [${level}] : ${message} `;
   // if (metadata) {
   //   msg += JSON.stringify(metadata);
   // }
   return msg;
 });
 
 const logger = winston.createLogger({
   level: "info",
   format: combine(winston.format.colorize(), splat(), timestamp(), myFormat),
   defaultMeta: { service: "smartreader" },
   transports: [
     new winston.transports.Console(),
     new winston.transports.File({ filename: "logs/combined.log" }),
   ],
 });
 
 module.exports = {
   logger,
 };
 