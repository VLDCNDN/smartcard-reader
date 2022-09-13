const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.urlencoded());

require("dotenv").config();
const port = process.env.PORT;

const sReader = require("./nfcreader");
sReader.handler(io);

httpServer.listen(port);