import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../services/websocket.service';
import { GameState } from '../../models/game.model';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100 p-8">
      <div class="max-w-4xl mx-auto">
        <div *ngIf="gameState" class="space-y-8">
          <!-- Game Info -->
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="text-center mb-4">
              <h2 class="text-xl font-bold">Round {{gameState.currentRound}} of {{gameState.totalRounds}}</h2>
            </div>
            
            <!-- Concepts -->
            <div class="flex justify-between text-lg font-bold mb-6">
              <span>{{gameState.currentQuestion?.leftConcept}}</span>
              <span>{{gameState.currentQuestion?.rightConcept}}</span>
            </div>

            <!-- Slider -->
            <input 
              type="range" 
              min="0" 
              max="100" 
              [value]="sliderPosition"
              (input)="onSliderChange($any($event.target).value)"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            >

            <!-- Submit Button -->
            <div class="mt-6 text-center">
              <button 
                (click)="submitGuess()"
                class="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
              >
                Submit Guess
              </button>
            </div>
          </div>

          <!-- Players List -->
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-bold mb-4">Players</h3>
            <div class="space-y-2">
              <div *ngFor="let player of gameState.players" 
                   class="flex justify-between items-center p-2 hover:bg-gray-50">
                <span>{{player.name}}</span>
                <span class="font-bold">{{player.score}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
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