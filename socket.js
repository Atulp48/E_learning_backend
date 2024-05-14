import { Server } from "socket.io";

export const initSocketServer = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("user connected");

    socket.on("notification", (data) => {
      io.emit("newNotification", data);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
