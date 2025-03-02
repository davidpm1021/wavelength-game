const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { getRandomQuestions } = require('./questions');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

const TOTAL_ROUNDS = 10;
const ROUND_TIME = 30; // seconds

const gameState = {
    players: [],
    currentRound: 0,
    totalRounds: TOTAL_ROUNDS,
    isGameStarted: false,
    currentQuestion: null,
    gamePhase: 'WAITING_FOR_PLAYERS',
    roundTimeRemaining: ROUND_TIME,
    roundResults: null,
    questions: []
};

let roundTimer = null;

function calculateScore(guess, correctPosition) {
    const distance = Math.abs(guess - correctPosition);
    return Math.max(0, Math.floor(100 - (distance * 2))); // More punishing for far guesses
}

function startRound() {
    gameState.currentRound++;
    gameState.currentQuestion = gameState.questions[gameState.currentRound - 1];
    gameState.gamePhase = 'ROUND_IN_PROGRESS';
    gameState.roundTimeRemaining = ROUND_TIME;
    gameState.roundResults = null;
    
    // Reset player submission status
    gameState.players.forEach(player => {
        player.hasSubmitted = false;
    });

    io.emit('gameStateUpdate', gameState);

    // Start round timer
    roundTimer = setInterval(() => {
        gameState.roundTimeRemaining--;
        io.emit('gameStateUpdate', gameState);

        if (gameState.roundTimeRemaining <= 0 || gameState.players.every(p => p.hasSubmitted)) {
            clearInterval(roundTimer);
            endRound();
        }
    }, 1000);
}

function endRound() {
    clearInterval(roundTimer);
    gameState.gamePhase = 'SHOWING_RESULTS';
    
    // Calculate and store round results
    const playerGuesses = gameState.players
        .filter(p => p.hasSubmitted)
        .map(p => ({
            playerId: p.id,
            playerName: p.name,
            position: p._lastGuess,
            score: calculateScore(p._lastGuess, gameState.currentQuestion.correctPosition)
        }));

    gameState.roundResults = {
        correctPosition: gameState.currentQuestion.correctPosition,
        playerGuesses,
        roundScores: {}
    };

    // Update player scores
    playerGuesses.forEach(guess => {
        const player = gameState.players.find(p => p.id === guess.playerId);
        if (player) {
            player.score += guess.score;
            gameState.roundResults.roundScores[player.id] = guess.score;
        }
    });

    io.emit('gameStateUpdate', gameState);
}

function resetGameState(clearPlayers = false) {
    if (clearPlayers) {
        gameState.players = [];
    } else {
        gameState.players.forEach(p => p.score = 0);
    }
    gameState.currentRound = 0;
    gameState.isGameStarted = false;
    gameState.currentQuestion = null;
    gameState.gamePhase = 'WAITING_FOR_PLAYERS';
    gameState.roundResults = null;
    gameState.questions = [];
    if (roundTimer) {
        clearInterval(roundTimer);
        roundTimer = null;
    }
}

// Clear all state on server startup
resetGameState(true);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Clean up any disconnected players on new connection
    gameState.players = gameState.players.filter(p => {
        const clientSocket = io.sockets.sockets.get(p.id);
        return clientSocket && clientSocket.connected;
    });

    // Reassign host if needed
    if (gameState.players.length > 0 && !gameState.players.some(p => p.isHost)) {
        const firstRealPlayer = gameState.players.find(p => !p.id.startsWith('dummy-'));
        if (firstRealPlayer) {
            firstRealPlayer.isHost = true;
        } else {
            gameState.players[0].isHost = true;
        }
    }

    // Send initial game state on connection
    socket.emit('gameStateUpdate', gameState);

    // Handle game state request
    socket.on('requestGameState', () => {
        console.log('Game state requested by:', socket.id);
        socket.emit('gameStateUpdate', gameState);
    });

    // Handle player joining
    socket.on('joinGame', (data) => {
        try {
            console.log('Join game data received:', data);
            const { playerName } = data;
            
            if (!playerName) {
                console.error('No player name provided');
                socket.emit('error', { message: 'Player name is required' });
                return;
            }

            // Always allow joining, reset game if needed
            if (gameState.isGameStarted) {
                console.log('Game in progress, resetting for new player');
                resetGameState(false);
            }

            console.log(`Player ${playerName} (${socket.id}) joining game`);
            
            // Remove any existing player with this socket id
            gameState.players = gameState.players.filter(p => p.id !== socket.id);
            
            // Create new player
            const player = {
                id: socket.id,
                name: playerName,
                isHost: gameState.players.length === 0 || gameState.players.every(p => p.id.startsWith('dummy-')),
                hasSubmittedGuess: false,
                score: 0
            };

            // If this player becomes host, remove host status from others
            if (player.isHost) {
                gameState.players.forEach(p => p.isHost = false);
            }

            gameState.players.push(player);

            // Emit updated game state to all clients
            io.emit('gameStateUpdate', gameState);
            
            // Send confirmation to the joining player
            socket.emit('joinGameSuccess', { playerId: socket.id });
        } catch (error) {
            console.error('Error in joinGame:', error);
            socket.emit('error', { message: 'Failed to join game', error: error.message });
        }
    });

    // Handle dummy player addition for development
    socket.on('addDummyPlayer', (dummyPlayer) => {
        console.log('Adding dummy player:', dummyPlayer);
        
        // Ensure dummy players are never hosts
        const newPlayer = {
            id: dummyPlayer.id,
            name: dummyPlayer.name,
            isHost: false,  // Force dummy players to never be hosts
            hasSubmittedGuess: false,
            score: 0
        };
        
        gameState.players.push(newPlayer);
        io.emit('gameStateUpdate', gameState);
    });

    // Handle player name setting
    socket.on('setPlayerName', (name) => {
        const player = gameState.players.find(p => p.id === socket.id);
        if (player) {
            player.name = name;
            io.emit('gameStateUpdate', gameState);
        }
    });

    socket.on('startGame', () => {
        const player = gameState.players.find(p => p.id === socket.id);
        if (!player?.isHost) return;

        gameState.isGameStarted = true;
        gameState.currentRound = 0;
        gameState.questions = getRandomQuestions(TOTAL_ROUNDS);
        gameState.players.forEach(p => p.score = 0);
        
        startRound();
    });

    socket.on('submit-guess', ({ position, playerId, isDummy }) => {
        console.log('Server: Received guess submission request:', {
            socketId: socket.id,
            playerId,
            position,
            isDummy,
            gamePhase: gameState.gamePhase,
            timestamp: new Date().toISOString()
        });

        if (gameState.gamePhase !== 'ROUND_IN_PROGRESS') {
            console.log('Server: Rejecting submission - game not in progress:', {
                currentPhase: gameState.gamePhase,
                timestamp: new Date().toISOString()
            });
            return;
        }

        // Use the provided playerId if available, otherwise use socket.id
        const targetPlayerId = playerId || socket.id;
        const player = gameState.players.find(p => p.id === targetPlayerId);

        console.log('Server: Processing guess submission:', {
            targetPlayerId,
            playerFound: !!player,
            position,
            isDummy,
            currentPlayers: gameState.players.map(p => ({
                id: p.id,
                name: p.name,
                hasSubmitted: p.hasSubmitted
            }))
        });

        if (!player) {
            console.error('Server: Player not found for submission:', {
                targetPlayerId,
                position,
                isDummy,
                allPlayerIds: gameState.players.map(p => p.id)
            });
            return;
        }

        if (player.hasSubmitted) {
            console.log('Server: Player has already submitted:', {
                playerId: player.id,
                playerName: player.name,
                timestamp: new Date().toISOString()
            });
            return;
        }

        player.hasSubmitted = true;
        player._lastGuess = position;
        
        console.log('Server: Updated player submission status:', {
            playerId: targetPlayerId,
            playerName: player.name,
            hasSubmitted: player.hasSubmitted,
            lastGuess: player._lastGuess,
            timestamp: new Date().toISOString()
        });

        io.emit('gameStateUpdate', gameState);

        // Check if all players have submitted
        const allSubmitted = gameState.players.every(p => p.hasSubmitted);
        console.log('Server: Checking all submissions:', {
            allSubmitted,
            players: gameState.players.map(p => ({
                id: p.id,
                name: p.name,
                hasSubmitted: p.hasSubmitted
            })),
            timestamp: new Date().toISOString()
        });

        if (allSubmitted) {
            console.log('Server: All players have submitted, ending round');
            clearInterval(roundTimer);
            endRound();
        }
    });

    socket.on('nextRound', () => {
        const player = gameState.players.find(p => p.id === socket.id);
        if (!player?.isHost) return;

        if (gameState.currentRound < gameState.totalRounds) {
            startRound();
        } else {
            gameState.gamePhase = 'GAME_OVER';
            io.emit('gameStateUpdate', gameState);
        }
    });

    socket.on('startNewGame', () => {
        const player = gameState.players.find(p => p.id === socket.id);
        if (!player?.isHost) return;

        gameState.isGameStarted = false;
        gameState.currentRound = 0;
        gameState.gamePhase = 'WAITING_FOR_PLAYERS';
        gameState.questions = [];
        gameState.currentQuestion = null;
        gameState.roundResults = null;
        gameState.players.forEach(p => p.score = 0);
        
        io.emit('gameStateUpdate', gameState);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const wasHost = gameState.players.find(p => p.id === socket.id)?.isHost;
        gameState.players = gameState.players.filter(p => p.id !== socket.id);
        
        // If host disconnected, assign new host if there are players
        if (wasHost && gameState.players.length > 0) {
            gameState.players[0].isHost = true;
        }

        // If no players left, reset game
        if (gameState.players.length === 0) {
            clearInterval(roundTimer);
            gameState.isGameStarted = false;
            gameState.currentRound = 0;
            gameState.gamePhase = 'WAITING_FOR_PLAYERS';
            gameState.questions = [];
            gameState.currentQuestion = null;
            gameState.roundResults = null;
        }

        io.emit('gameStateUpdate', gameState);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 