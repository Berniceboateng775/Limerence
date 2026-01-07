import { io } from "socket.io-client";

// Connect to backend (adjust URL for production)
const socket = io("http://localhost:5000", {
    autoConnect: false // Connect manually on login to attach auth? Or just connect global?
});

export default socket;
