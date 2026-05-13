let ioInstance = null;

const setSocketServer = (io) => {
    ioInstance = io;
};

const getSocketServer = () => ioInstance;

export { setSocketServer, getSocketServer };
