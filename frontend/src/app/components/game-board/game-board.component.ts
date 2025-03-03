import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';
import { GameState } from '../../models/game.model';
import { GamePhase } from '../../models/game.model';

@Component({
    selector: 'app-game-board',
    templateUrl: './game-board.component.html',
    styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent implements OnInit {
    gameState: GameState | null = null;
    sliderPosition = 50;
    showStartPrompt = false;
    isHost = false;

    constructor(private webSocketService: WebSocketService) {}

    ngOnInit(): void {
        this.webSocketService.getGameState().subscribe(state => {
            this.gameState = state;
            // Update host status
            const currentPlayer = state?.players?.find(p => p.id === this.webSocketService.playerId);
            this.isHost = currentPlayer?.isHost || false;
            
            // Show start prompt only for host in waiting state
            if (state?.gamePhase === GamePhase.WAITING_FOR_PLAYERS && 
                this.isHost && 
                !state.isGameStarted) {
                this.showStartPrompt = true;
            } else {
                this.showStartPrompt = false;
            }
        });
    }

    onSliderChange(position: number): void {
        this.sliderPosition = position;
    }

    submitGuess(): void {
        this.webSocketService.submitGuess(this.sliderPosition);
    }

    startGame(): void {
        this.showStartPrompt = false;
        this.webSocketService.startGame();
    }
} 