module.exports.handler = (io) => {
  const { NFC, KEY_TYPE_A } = require("nfc-pcsc");
  const { logger } = require("../logger");

  const sector = process.env.SECTOR;
  const sectorBlocks = [
    [0, 1, 2, 3], // sector 0
    [4, 5, 6, 7], // sector 1
    [8, 9, 10, 11], // sector 2
    [12, 13, 14, 15], // sector 3
    [16, 17, 18, 19], // sector 4
  ];

  // to establish connection with the front end
  io.of("/card").on("connection", (socket) => {
    logger.info(`socket connected`);

    const nfc = new NFC();
    nfc.once("reader", (reader) => {
      logger.info(`${reader.reader.name}  device attached`);

      reader.autoProcessing = false;

      reader.on("card", (card) => {
        logger.info(`${reader.reader.name} card detected - uid: ${card.uid}`);
        const key = "FFFFFFFFFFFF";
        const keyType = KEY_TYPE_A;

        // inform front end that there's someone tapped a card
        socket.emit("cardinserted", { inserted: true });
        socket.on("cardread", async () => {
          try {
            // inform front end that the card starting to progress
            socket.emit("auth", { progressing: true });
            await reader.authenticate(sectorBlocks[sector][0], keyType, key);
            logger.info(`sector ${sector} successfully authenticated`);
          } catch (err) {
            socket.emit("auth", { progressing: false });
            logger.error(
              `error when authenticating block ${sectorBlocks[sector][0]} within the sector ${sector}`,
              err
            );
          }

          // start reading the sector
          try {
            logger.info(`Reading Sector: ${sector} `);
            let data = await reader.read(sectorBlocks[sector][0], 48, 16);
            const payload = data.toString();
            let formatPayload = [];
            if (payload === null || payload === "") {
              socket.emit("RoomNumber", {
                error: true,
                roomNumber: "",
                message: "Room Number not found!",
              });
            } else {
              formatPayload = payload.split("\u0000");
              socket.emit("RoomNumber", {
                error: false,
                roomNumber: formatPayload[0],
                message: "",
              });

              logger.info(`Payload: ${formatPayload[0]} `);
            }

            socket.emit("auth", { progressing: false });
          } catch (err) {
            socket.emit("auth", { progressing: false });
            logger.error(`error when reading data`, err);
          }
        });
      });

      reader.on("card.off", (card) => {
        logger.info(`${reader.reader.name}  card removed`);
        socket.emit("cardinserted", { inserted: false });
      });

      reader.on("error", (err) => {
        logger.error(`${reader.reader.name}  an error occurred`, err);
        socket.emit("cardinserted", { inserted: false });
      });

      reader.on("end", () => {
        logger.info(`${reader.reader.name}  device removed`);
      });
    });

    socket.on("disconnect", (reason) => {
      logger.info(`pcsc closed`);
      reader.close();
    });

    nfc.on("error", (err) => {
      logger.error(`nfc.on - an error occurred`, err);
    });
  });
};
