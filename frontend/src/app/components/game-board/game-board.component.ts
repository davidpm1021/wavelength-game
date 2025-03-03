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
    showStartPrompt = true;

    constructor(private webSocketService: WebSocketService) {}

    ngOnInit(): void {
        this.webSocketService.getGameState().subscribe(state => {
            this.gameState = state;
            if (state?.gamePhase === GamePhase.WAITING_FOR_PLAYERS && 
                this.isHost && 
                !state.isGameStarted &&
                !this.gameState?.currentRound) {
                this.showStartPrompt = true;
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