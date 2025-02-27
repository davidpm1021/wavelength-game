import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { GameState } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket;
  private gameState = new BehaviorSubject<GameState | null>(null);
  private readonly SERVER_URL = 'http://localhost:3000'; // Update this with your server URL

  constructor() {
    this.socket = io(this.SERVER_URL);
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    this.socket.on('gameStateUpdate', (state: GameState) => {
      this.gameState.next(state);
    });
  }

  joinGame(playerName: string): void {
    this.socket.emit('joinGame', { playerName });
  }

  submitGuess(position: number): void {
    this.socket.emit('submitGuess', { position });
  }

  getGameState() {
    return this.gameState.asObservable();
  }
} 