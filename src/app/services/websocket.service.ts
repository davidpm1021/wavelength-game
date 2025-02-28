import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameState } from '../models/game.model';
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
      console.log('WebSocketService: Received game state update:', state);
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
    this.socket.emit('addDummyPlayer', {
      id: 'dummy-' + Math.random().toString(36).substr(2, 9),
      name: 'Test Opponent',
      isHost: false
    });
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
    console.log('WebSocketService: Submitting guess:', position);
    this.socket.emit('submitGuess', { position });
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