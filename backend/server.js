const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { getRandomQuestions } = require('./questions');

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS']
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// Add a basic route for testing
app.get('/', (req, res) => {
    res.send('Wavelength Game Server is running');
});

const TOTAL_ROUNDS = 10;
const ROUND_TIME = 30; // seconds
const MAX_PLAYERS = 30; // Increased from 20 to 30

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

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

// Utility function for logging score calculations
function logScoreCalculation(type, data) {
    console.log(`[${type}]`, {
        ...data,
        timestamp: new Date().toISOString()
    });
}

// Validate and normalize input values
function validateAndNormalizeInput(value, min, max, fieldName) {
    if (value === undefined || value === null) {
        throw new Error(`Invalid input: ${fieldName} is required`);
    }
    return Math.max(min, Math.min(max, Number(value)));
}

function calculateScore(guess, correctPosition, minValue = 0, maxValue = 100) {
    try {
        // Validate and normalize inputs
        guess = validateAndNormalizeInput(guess, minValue, maxValue, 'guess');
        correctPosition = validateAndNormalizeInput(correctPosition, minValue, maxValue, 'correctPosition');
        minValue = Number(minValue);
        maxValue = Number(maxValue);

        console.log('[SCORE_CALCULATION_START]', {
            inputs: {
                guess,
                correctPosition,
                minValue,
                maxValue
            },
            timestamp: new Date().toISOString()
        });

        if (maxValue <= minValue) {
            throw new Error('Invalid range: maxValue must be greater than minValue');
        }

        const accuracy = calculateAccuracy(guess, correctPosition, minValue, maxValue);
        
        console.log('[SCORE_CALCULATION_RESULT]', {
            inputs: { guess, correctPosition, minValue, maxValue },
            output: accuracy,
            calculation: 'score',
            expectedScore: Math.round(100 - (Math.abs(guess - correctPosition) / (maxValue - minValue) * 100))
        });
        
        // Log 50% range check
        const range = maxValue - minValue;
        const midPoint = minValue + (range / 2);
        if (Math.abs(guess - midPoint) < range * 0.05) {
            console.log('[MIDPOINT_GUESS_CHECK]', {
                guess,
                midPoint,
                expectedScore: Math.round(100 - (Math.abs(guess - midPoint) / range * 100)),
                actualScore: accuracy
            });
        }
        
        return accuracy;
    } catch (error) {
        console.error('[SCORE_ERROR]', error);
        return 0; // Return 0 score on error
    }
}

function calculateAccuracy(guess, correctPosition, minValue = 0, maxValue = 100) {
    try {
        const distance = Math.abs(guess - correctPosition);
        const range = maxValue - minValue;
        const accuracy = Math.max(0, Math.min(100, 100 - (distance / range * 100)));
        
        logScoreCalculation('ACCURACY', {
            input: { guess, correctPosition, minValue, maxValue },
            calculation: { distance, range },
            output: accuracy
        });
        
        return Math.round(accuracy); // Round to nearest integer
    } catch (error) {
        console.error('[ACCURACY_ERROR]', error);
        return 0; // Return 0 accuracy on error
    }
}

function updatePlayerAccuracy(player, accuracy) {
    try {
        if (!player) {
            throw new Error('Invalid player object');
        }

        // Initialize arrays if they don't exist
        if (!player.guessHistory) {
            player.guessHistory = [];
        }
        if (!player.roundScores) {
            player.roundScores = [];
        }

        // Update best accuracy if current is higher
        if (!player.bestAccuracy || accuracy > player.bestAccuracy) {
            player.bestAccuracy = accuracy;
        }

        // Add to guess history
        player.guessHistory.push(accuracy);

        // Calculate average accuracy
        player.averageAccuracy = Math.round(
            player.guessHistory.reduce((a, b) => a + b, 0) / player.guessHistory.length
        );

        logScoreCalculation('PLAYER_UPDATE', {
            playerId: player.id,
            accuracy,
            bestAccuracy: player.bestAccuracy,
            averageAccuracy: player.averageAccuracy,
            guessCount: player.guessHistory.length
        });
    } catch (error) {
        console.error('[PLAYER_UPDATE_ERROR]', error);
    }
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
    try {
        clearInterval(roundTimer);
        gameState.gamePhase = 'SHOWING_RESULTS';
        
        console.log('[ROUND_END_START]', {
            round: gameState.currentRound,
            question: gameState.currentQuestion,
            timestamp: new Date().toISOString()
        });
        
        // Calculate and store round results
        const playerGuesses = gameState.players
            .filter(p => p.hasSubmitted)
            .map(p => {
                console.log('[PROCESSING_PLAYER_GUESS]', {
                    playerId: p.id,
                    playerName: p.name,
                    lastGuess: p._lastGuess,
                    correctPosition: gameState.currentQuestion.correctPosition,
                    minValue: gameState.currentQuestion.minValue,
                    maxValue: gameState.currentQuestion.maxValue
                });

                const score = calculateScore(
                    p._lastGuess, 
                    gameState.currentQuestion.correctPosition,
                    gameState.currentQuestion.minValue,
                    gameState.currentQuestion.maxValue
                );

                console.log('[PLAYER_ROUND_SCORE]', {
                    playerId: p.id,
                    playerName: p.name,
                    guess: p._lastGuess,
                    score: score,
                    currentTotalScore: p.score,
                    newTotalScore: p.score + score
                });

                return {
                    playerId: p.id,
                    playerName: p.name,
                    position: p._lastGuess,
                    score: score
                };
            });

        gameState.roundResults = {
            correctPosition: gameState.currentQuestion.correctPosition,
            playerGuesses,
            roundScores: {}
        };

        // Update player scores
        playerGuesses.forEach(guess => {
            const player = gameState.players.find(p => p.id === guess.playerId);
            if (player) {
                const oldScore = player.score;
                player.score += guess.score;
                gameState.roundResults.roundScores[player.id] = guess.score;
                
                // Ensure roundScores array exists and update it
                if (!player.roundScores) {
                    player.roundScores = [];
                }
                player.roundScores[gameState.currentRound - 1] = guess.score;

                console.log('[PLAYER_SCORE_UPDATE]', {
                    playerId: player.id,
                    playerName: player.name,
                    roundNumber: gameState.currentRound,
                    oldScore: oldScore,
                    roundScore: guess.score,
                    newTotalScore: player.score,
                    allRoundScores: player.roundScores
                });
            }
        });

        console.log('[ROUND_END_COMPLETE]', {
            round: gameState.currentRound,
            roundResults: gameState.roundResults,
            playerScores: gameState.players.map(p => ({ 
                name: p.name, 
                score: p.score,
                roundScores: p.roundScores 
            }))
        });

        io.emit('gameStateUpdate', gameState);
    } catch (error) {
        console.error('[ROUND_END_ERROR]', error);
        gameState.gamePhase = 'ERROR';
        io.emit('gameStateUpdate', gameState);
    }
}

function resetGameState(resetPlayers = true) {
    if (resetPlayers) {
        gameState.players = [];
    } else {
        // Reset player state but keep accuracy statistics
        gameState.players.forEach(player => {
            player.hasSubmitted = false;
            player._lastGuess = null;
            player.score = 0;
            // Don't reset bestAccuracy, averageAccuracy, or guessHistory
        });
    }
    gameState.currentRound = 0;
    gameState.isGameStarted = false;
    gameState.currentQuestion = null;
    gameState.gamePhase = 'WAITING_FOR_PLAYERS';
    gameState.roundTimeRemaining = ROUND_TIME;
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
    console.log('User connected:', {
        socketId: socket.id,
        origin: socket.handshake.headers.origin,
        timestamp: new Date().toISOString(),
        headers: socket.handshake.headers,
        query: socket.handshake.query,
        totalPlayers: gameState.players.length
    });

    socket.on('error', (error) => {
        console.error('Socket error:', {
            socketId: socket.id,
            error: error?.message || error,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', {
            socketId: socket.id,
            error: error?.message || error,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('connect_timeout', () => {
        console.error('Connection timeout:', {
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });
    });

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
            
            // Remove any existing player with this socket id and any stale dummy players
            gameState.players = gameState.players.filter(p => {
                if (p.id === socket.id) return false;
                if (p.id.startsWith('dummy-')) {
                    const clientSocket = io.sockets.sockets.get(p.id);
                    return clientSocket && clientSocket.connected;
                }
                return true;
            });
            
            // Create new player
            const player = {
                id: socket.id,
                name: playerName,
                isHost: gameState.players.length === 0,
                hasSubmitted: false,
                score: 0,
                bestAccuracy: 0,
                averageAccuracy: 0,
                guessHistory: [],
                _lastGuess: null
            };

            // If this player becomes host, remove host status from others
            if (player.isHost) {
                gameState.players.forEach(p => p.isHost = false);
            }

            gameState.players.push(player);

            console.log('Current players after join:', gameState.players.map(p => ({
                id: p.id,
                name: p.name,
                isHost: p.isHost,
                isDummy: p.isDummy
            })));

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
    socket.on('addDummyPlayer', (dummyPlayer, callback) => {
        console.log('Adding dummy player:', dummyPlayer);
        
        // Check if we've reached the maximum number of players
        if (gameState.players.length >= MAX_PLAYERS) {
            console.log('Maximum number of players reached');
            if (callback) callback({ success: false, reason: 'Maximum players reached' });
            return;
        }

        // Check if a player with this ID already exists
        if (gameState.players.some(p => p.id === dummyPlayer.id)) {
            console.log('Player with this ID already exists:', dummyPlayer.id);
            if (callback) callback({ success: false, reason: 'Player ID already exists' });
            return;
        }
        
        // Create new dummy player with all necessary fields
        const newPlayer = {
            id: dummyPlayer.id,
            name: dummyPlayer.name,
            isHost: false,  // Force dummy players to never be hosts
            hasSubmitted: false,
            score: 0,
            bestAccuracy: 0,
            averageAccuracy: 0,
            guessHistory: [],
            _lastGuess: null,
            isDummy: true
        };
        
        gameState.players.push(newPlayer);
        console.log(`Added dummy player ${dummyPlayer.name} (${dummyPlayer.id}). Total players: ${gameState.players.length}`);
        
        // Log current player list for debugging
        console.log('Current players:', gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            isDummy: p.isDummy
        })));

        io.emit('gameStateUpdate', gameState);
        if (callback) callback({ success: true });
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

        // Allow dummy players to submit through any socket
        const targetPlayerId = playerId || socket.id;
        const player = gameState.players.find(p => p.id === targetPlayerId);

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

        // Add before processing the guess
        console.log(`[GUESS] Received guess submission: playerId=${targetPlayerId}, position=${position}, currentRound=${gameState.currentRound}`);
        console.log(`[GUESS] Current question: min=${gameState.currentQuestion.minValue}, max=${gameState.currentQuestion.maxValue}, correct=${gameState.currentQuestion.correctPosition}`);
        
        // Process the guess
        player.hasSubmitted = true;
        player._lastGuess = position;

        // Calculate and update accuracy statistics
        const accuracy = calculateAccuracy(
            position,
            gameState.currentQuestion.correctPosition,
            gameState.currentQuestion.minValue,
            gameState.currentQuestion.maxValue
        );
        updatePlayerAccuracy(player, accuracy);
        
        // Add after processing
        console.log(`[GUESS] Player score updated: playerId=${targetPlayerId}, roundScore=${accuracy}, totalScore=${player.score}, roundScores=${JSON.stringify(player.roundScores || [])}`);

        io.emit('gameStateUpdate', gameState);

        // Check if all players have submitted
        const allSubmitted = gameState.players.every(p => p.hasSubmitted);
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
        
        // Remove the disconnected player and any stale dummy players
        gameState.players = gameState.players.filter(p => {
            if (p.id === socket.id) return false; // Remove disconnected player
            if (p.id.startsWith('dummy-')) {
                // For dummy players, check if they're still needed
                const totalPlayers = gameState.players.length;
                const realPlayers = gameState.players.filter(p => !p.id.startsWith('dummy-')).length;
                return totalPlayers <= MAX_PLAYERS && realPlayers < MAX_PLAYERS;
            }
            return true; // Keep other players
        });
        
        // If host disconnected, assign new host if there are players
        if (wasHost && gameState.players.length > 0) {
            const firstRealPlayer = gameState.players.find(p => !p.id.startsWith('dummy-'));
            if (firstRealPlayer) {
                firstRealPlayer.isHost = true;
            } else {
                gameState.players[0].isHost = true;
            }
        }

        // If no players left, reset game
        if (gameState.players.length === 0) {
            clearInterval(roundTimer);
            resetGameState(true);
        }

        io.emit('gameStateUpdate', gameState);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 