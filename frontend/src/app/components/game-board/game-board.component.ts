import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';
import { GameState } from '../../models/game.model';

@Component({
    selector: 'app-game-board',
    templateUrl: './game-board.component.html',
    styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent implements OnInit {
    gameState: GameState | null = null;
    sliderPosition = 50;

    constructor(private webSocketService: WebSocketService) {}

    ngOnInit(): void {
        this.webSocketService.getGameState().subscribe(state => {
            this.gameState = state;
        });
    }

    onSliderChange(position: number): void {
        this.sliderPosition = position;
    }

    submitGuess(): void {
        this.webSocketService.submitGuess(this.sliderPosition);
    }
} 