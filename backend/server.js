const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

const gameState = {
    players: [],
    currentRound: 0,
    totalRounds: 10,
    isGameStarted: false,
    currentQuestion: {
        leftConcept: "Traditional Learning",
        rightConcept: "Modern Learning",
        correctPosition: 50
    }
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinGame', ({ playerName }) => {
        const newPlayer = {
            id: socket.id,
            name: playerName,
            score: 0,
            isHost: gameState.players.length === 0
        };
        
        gameState.players.push(newPlayer);
        io.emit('gameStateUpdate', gameState);
    });

    socket.on('submitGuess', ({ position }) => {
        const player = gameState.players.find(p => p.id === socket.id);
        if (player) {
            // Calculate score based on proximity to correct position
            const distance = Math.abs(position - gameState.currentQuestion.correctPosition);
            const score = Math.max(0, 100 - distance);
            player.score += score;
            
            io.emit('gameStateUpdate', gameState);
        }
    });

    socket.on('disconnect', () => {
        gameState.players = gameState.players.filter(p => p.id !== socket.id);
        io.emit('gameStateUpdate', gameState);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 