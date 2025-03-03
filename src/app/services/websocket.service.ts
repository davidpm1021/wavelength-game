import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameState, Player } from '../models/game.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket;
  private gameState = new BehaviorSubject<GameState | null>(null);
  private readonly SERVER_URL = 'http://localhost:3000'; // Update this with your server URL
  private isDevelopment = !environment.production;
  private isConnecting = false;
  private pendingJoinData: { playerName: string, gameConfig: any } | null = null;
  private dummyOpponentId: string | null = null;
  
  // Add gameConfig as a class property
  private readonly gameConfig = {
    rounds: 5,
    questions: [
      {
        text: "What was the Behavioral Economics word count average BEFORE updates?",
        correctPosition: 689,
        minValue: 400,
        maxValue: 800,
        leftConcept: "400 words",
        rightConcept: "800 words"
      },
      {
        text: "What was the Behavioral Economics word count average AFTER updates?",
        correctPosition: 513,
        minValue: 400,
        maxValue: 800,
        leftConcept: "400 words",
        rightConcept: "800 words"
      },
      {
        text: "How many activities were retired in the last 3 units?",
        correctPosition: 23,
        minValue: 0,
        maxValue: 50,
        leftConcept: "0 activities",
        rightConcept: "50 activities"
      },
      {
        text: "How many total words were reduced over 14 Taxes activities?",
        correctPosition: 2478,
        minValue: 0,
        maxValue: 5000,
        leftConcept: "0 words",
        rightConcept: "5000 words"
      },
      {
        text: "What was the percentage increase in resource saves after tax unit revamp?",
        correctPosition: 8,
        minValue: 0,
        maxValue: 20,
        leftConcept: "0%",
        rightConcept: "20%"
      }
    ]
  };

  playerId: string | null = null;

  constructor() {
    console.log('WebSocketService: Initializing');
    this.socket = io(this.SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false // Don't connect automatically
    });
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    this.socket.on('connect', () => {
      console.log('WebSocketService: Connected to server');
      this.playerId = this.socket.id || null;
      this.isConnecting = false;

      if (this.pendingJoinData) {
        this.socket.emit('joinGame', this.pendingJoinData);
        this.pendingJoinData = null;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocketService: Connection error', error);
      this.isConnecting = false;
      this.gameState.next(null);
    });

    this.socket.on('gameStateUpdate', (state: GameState) => {
      console.log('WebSocketService: Received game state update', {
        phase: state.gamePhase,
        round: state.currentRound,
        questionText: state.currentQuestion?.text
      });

      // Validate and merge question data
      if (state.currentQuestion) {
        const currentRound = state.currentRound || 1;
        const configQuestion = this.gameConfig.questions[currentRound - 1];
        
        // If server question is missing required fields, merge with config
        if (!state.currentQuestion.text || !state.currentQuestion.minValue || !state.currentQuestion.maxValue) {
          state.currentQuestion = {
            ...configQuestion,
            ...state.currentQuestion,
            // Ensure these critical fields come from config
            text: configQuestion.text,
            minValue: configQuestion.minValue,
            maxValue: configQuestion.maxValue,
            leftConcept: configQuestion.leftConcept,
            rightConcept: configQuestion.rightConcept,
            correctPosition: configQuestion.correctPosition
          };
        }
      }

      // Initialize roundScores array for new players
      state.players.forEach(player => {
        if (!player.roundScores) {
          player.roundScores = [];
        }
      });

      this.gameState.next(state);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocketService: Server error:', error?.message || error);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocketService: Disconnected from server');
      this.playerId = null;
      this.gameState.next(null);
      this.isConnecting = false;
    });

    this.socket.on('joinGameSuccess', (data: { playerId: string }) => {
      console.log('WebSocketService: Successfully joined game', data);
      this.playerId = data.playerId;
    });
  }

  private addDummyOpponent() {
    this.dummyOpponentId = 'dummy-' + Math.random().toString(36).substr(2, 9);
    this.socket.emit('addDummyPlayer', {
        name: 'Test Opponent',
        id: this.dummyOpponentId
    });
  }

  addDummyPlayers(count: number): void {
    const addNextDummyPlayer = (index: number) => {
      if (index >= count) return;

      const dummyId = 'dummy-' + Math.random().toString(36).substr(2, 9);
      
      this.socket.emit('addDummyPlayer', {
        name: `Test Player ${index + 1}`,
        id: dummyId
      }, (response: { success: boolean }) => {
        this.setupDummyPlayerBehavior(dummyId);
        setTimeout(() => addNextDummyPlayer(index + 1), 100);
      });
    };

    addNextDummyPlayer(0);
  }

  private setupDummyPlayerBehavior(dummyId: string): void {
    this.socket.on('gameStateUpdate', (state: GameState) => {
      // Only proceed if the game is in progress and the dummy player hasn't submitted yet
      if (state.gamePhase === 'ROUND_IN_PROGRESS') {
        const dummyPlayer = state.players.find(p => p.id === dummyId);
        if (dummyPlayer && !dummyPlayer.hasSubmitted) {
          // Random delay between 2 and 15 seconds
          const minDelay = 2000;
          const maxDelay = 15000;
          const delay = Math.random() * (maxDelay - minDelay) + minDelay;
          
          console.log(`WebSocketService: Dummy player ${dummyId} will submit in ${Math.round(delay/1000)} seconds`);
          
          setTimeout(() => {
            if (this.socket.connected) {
              // Generate a random guess within the current question's range
              const currentQuestion = state.currentQuestion;
              const min = currentQuestion?.minValue || 0;
              const max = currentQuestion?.maxValue || 100;
              const dummyGuess = Math.floor(Math.random() * (max - min)) + min;
              
              console.log(`WebSocketService: Dummy player ${dummyId} submitting guess:`, dummyGuess);
              
              this.socket.emit('submit-guess', {
                playerId: dummyId,
                position: dummyGuess,
                isDummy: true
              });
            }
          }, delay);
        }
      }
    });
  }

  joinGame(playerName: string): void {
    if (this.isConnecting) {
      return;
    }

    const joinData = { 
      playerName,
      gameConfig: this.gameConfig 
    };

    this.pendingJoinData = joinData;

    if (!this.socket.connected) {
      this.isConnecting = true;
      this.socket.connect();
    } else {
      this.socket.emit('joinGame', joinData);
      this.pendingJoinData = null;
    }
  }

  submitGuess(position: number): void {
    if (!this.socket.connected) {
      console.error('WebSocket: Cannot submit guess - socket not connected', {
        socketId: this.socket.id,
        connected: this.socket.connected,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!this.playerId) {
      console.error('WebSocket: Cannot submit guess - no player ID', {
        socketId: this.socket.id,
        playerId: this.playerId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log('WebSocket: Submitting guess', {
      playerId: this.playerId,
      position: Math.round(position)
    });

    this.socket.emit('submit-guess', { 
      playerId: this.playerId,
      position: Math.round(position)
    }, (response: { success: boolean }) => {
      console.log('WebSocket: Server acknowledged guess submission', {
        response,
        playerId: this.playerId,
        position: Math.round(position)
      });
    });
  }

  startGame(): void {
    console.log('WebSocketService: Starting game');
    this.socket.emit('startGame', null, (response: { success: boolean }) => {
      console.log('WebSocketService: Server acknowledged game start', response);
    });
  }

  nextRound(): void {
    console.log('WebSocketService: Moving to next round');
    this.socket.emit('nextRound', null, (response: { success: boolean }) => {
      console.log('WebSocketService: Server acknowledged next round', response);
    });
  }

  startNewGame(): void {
    console.log('WebSocketService: Starting new game');
    this.socket.emit('startNewGame');
  }

  endGame(): void {
    console.log('WebSocketService: Ending game', {
      socketId: this.socket.id,
      connected: this.socket.connected,
      timestamp: new Date().toISOString()
    });
    
    if (!this.socket.connected) {
      console.error('WebSocketService: Cannot end game - socket not connected');
      return;
    }

    this.socket.emit('endGame', null, (response: { success: boolean }) => {
      console.log('WebSocketService: Server acknowledged game end', {
        response,
        timestamp: new Date().toISOString(),
        socketId: this.socket.id
      });
      
      if (!response.success) {
        console.error('WebSocketService: Failed to end game', response);
      }
    });
  }

  getGameState(): Observable<GameState | null> {
    return this.gameState.asObservable();
  }
} 