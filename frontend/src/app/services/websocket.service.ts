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

    constructor() {
        this.socket = io('your-websocket-server-url');
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