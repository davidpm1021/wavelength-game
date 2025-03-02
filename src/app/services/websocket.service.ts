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
  playerId: string | null = null;
  private isDevelopment = !environment.production;
  private isConnecting = false;
  private pendingJoinData: { playerName: string } | null = null;
  private dummyOpponentId: string | null = null;

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
      console.log('WebSocketService: Connected to server', this.socket.id);
      this.playerId = this.socket.id || null;
      this.isConnecting = false;

      // If there was a pending join, send it now
      if (this.pendingJoinData) {
        console.log('WebSocketService: Sending pending join data');
        this.socket.emit('joinGame', this.pendingJoinData);
        this.pendingJoinData = null;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocketService: Connection error:', error);
      this.isConnecting = false;
      this.gameState.next(null);
    });

    this.socket.on('gameStateUpdate', (state: GameState) => {
      console.log('WebSocket: Received game state update', {
        phase: state.gamePhase,
        round: state.currentRound,
        players: state.players.map(p => ({
          name: p.name,
          id: p.id,
          hasSubmitted: p.hasSubmitted
        }))
      });
      this.gameState.next(state);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocketService: Server error:', error);
      if (error.message) {
        console.error('Error message:', error.message);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocketService: Disconnected from server');
      this.playerId = null;
      this.gameState.next(null);
      this.isConnecting = false;
    });

    this.socket.on('joinGameSuccess', (data: { playerId: string }) => {
      console.log('WebSocketService: Successfully joined game:', data);
      this.playerId = data.playerId;
      
      // Add dummy opponent after successful join in development mode
      if (this.isDevelopment) {
        setTimeout(() => this.addDummyOpponent(), 1000);
      }
    });
  }

  private addDummyOpponent() {
    console.log('WebSocketService: Adding dummy opponent');
    this.dummyOpponentId = 'dummy-' + Math.random().toString(36).substr(2, 9);
    this.socket.emit('addDummyPlayer', {
        name: 'Test Opponent',
        id: this.dummyOpponentId
    });
    console.log('WebSocketService: Sent dummy opponent add request');
  }

  joinGame(playerName: string): void {
    console.log('WebSocketService: Joining game as:', playerName);
    
    if (this.isConnecting) {
      console.log('WebSocketService: Already attempting to connect');
      return;
    }

    const joinData = { playerName };
    this.pendingJoinData = joinData;

    if (!this.socket.connected) {
      console.log('WebSocketService: Socket not connected, connecting...');
      this.isConnecting = true;
      this.socket.connect();
    } else {
      console.log('WebSocketService: Already connected, sending join data');
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

    console.log('WebSocket: Attempting to submit guess', {
      socketId: this.socket.id,
      playerId: this.playerId,
      position,
      socketConnected: this.socket.connected,
      hasDummyOpponent: !!this.dummyOpponentId,
      timestamp: new Date().toISOString()
    });

    // Submit the player's guess with acknowledgment
    this.socket.emit('submit-guess', { 
      playerId: this.playerId,
      position 
    }, (response: { success: boolean }) => {
      console.log('WebSocket: Server acknowledged guess submission', {
        response,
        playerId: this.playerId,
        position,
        timestamp: new Date().toISOString()
      });
    });

    // Log current game state
    const currentState = this.gameState.getValue();
    console.log('WebSocket: Current game state at submission:', {
      phase: currentState?.gamePhase,
      round: currentState?.currentRound,
      players: currentState?.players?.map(p => ({
        id: p.id,
        name: p.name,
        hasSubmitted: p.hasSubmitted,
        isCurrentPlayer: p.id === this.playerId,
        isDummy: p.id === this.dummyOpponentId
      }))
    });

    // If we have a dummy opponent, submit their guess after a delay
    if (this.dummyOpponentId) {
      console.log('WebSocket: Scheduling dummy opponent guess', {
        dummyId: this.dummyOpponentId,
        delay: 1500,
        timestamp: new Date().toISOString()
      });

      setTimeout(() => {
        if (!this.socket.connected) {
          console.error('WebSocket: Cannot submit dummy guess - socket disconnected');
          return;
        }

        const dummyPosition = Math.floor(Math.random() * 100);
        console.log('WebSocket: Submitting dummy opponent guess', {
          dummyId: this.dummyOpponentId,
          position: dummyPosition,
          socketConnected: this.socket.connected,
          timestamp: new Date().toISOString()
        });

        this.socket.emit('submit-guess', {
          playerId: this.dummyOpponentId,
          position: dummyPosition,
          isDummy: true
        }, (response: { success: boolean }) => {
          console.log('WebSocket: Server acknowledged dummy guess submission', {
            response,
            dummyId: this.dummyOpponentId,
            position: dummyPosition,
            timestamp: new Date().toISOString()
          });
        });
      }, 1500);
    }
  }

  startGame(): void {
    console.log('WebSocketService: Starting game');
    this.socket.emit('startGame');
  }

  nextRound(): void {
    console.log('WebSocketService: Moving to next round');
    this.socket.emit('nextRound');
  }

  startNewGame(): void {
    console.log('WebSocketService: Starting new game');
    this.socket.emit('startNewGame');
  }

  getGameState(): Observable<GameState | null> {
    return this.gameState.asObservable();
  }
} 