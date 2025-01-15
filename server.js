const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let messages = []; // Lista przechowywanych wiadomości

io.on('connection', (socket) => {
    console.log('Użytkownik połączony:', socket.id);

    // Wysyłanie istniejących wiadomości do nowego użytkownika
    socket.emit('loadMessages', messages);

    // Obsługa nowej wiadomości
    socket.on('newMessage', (message) => {
        messages.push(message);
        io.emit('message', message); // Rozsyłanie wiadomości do wszystkich
    });

    socket.on('disconnect', () => {
        console.log('Użytkownik rozłączony:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Serwer działa na porcie 3000');
});
