import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../services/websocket.service';
import { GameState, GamePhase, Player } from '../../models/game.model';
import { Subscription } from 'rxjs';
import { GaugeComponent } from '../gauge/gauge.component';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, GaugeComponent],
  styles: [`
    .container {
      min-height: 100vh;
      background-color: #f3f4f6;
      padding: 2rem;
    }
    .game-content {
      max-width: 64rem;
      margin: 0 auto;
    }
    .card {
      background-color: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }
    .title {
      font-size: 1.25rem;
      font-weight: bold;
      text-align: center;
      margin-bottom: 1rem;
    }
    .concepts {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      margin-bottom: 1.5rem;
    }
    .button {
      background-color: #3b82f6;
      color: white;
      padding: 0.5rem 1.5rem;
      border-radius: 0.375rem;
      border: none;
      cursor: pointer;
      margin-top: 1.5rem;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .player-list {
      margin-top: 0.5rem;
    }
    .player-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
    }
    .player-item:hover {
      background-color: #f9fafb;
    }
    .score {
      font-weight: bold;
    }
    .waiting-room {
      text-align: center;
      padding: 2rem;
    }
    .timer {
      font-size: 1.5rem;
      font-weight: bold;
      text-align: center;
      margin: 1rem 0;
      color: #4b5563;
    }
    .results {
      margin-top: 1rem;
    }
    .correct-position {
      font-weight: bold;
      color: #059669;
    }
    .player-guess {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .guess-score {
      color: #059669;
    }
    .disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .host-controls {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }
  `],
  template: `
    <div class="container">
      <div class="game-content">
        <div *ngIf="!gameState" class="card waiting-room">
          <h2 class="title">Connecting to game server...</h2>
        </div>
        
        <ng-container *ngIf="gameState">
          <!-- Debug info -->
          <div class="card" style="margin-bottom: 1rem;">
            <pre>Game Phase: {{gameState.gamePhase}}</pre>
            <pre>Players: {{gameState.players | json}}</pre>
          </div>

          <!-- Waiting Room -->
          <div *ngIf="gameState.gamePhase === GamePhase.WAITING_FOR_PLAYERS" class="card waiting-room">
            <h2 class="title">Waiting for Players</h2>
            <div class="player-list">
              <div *ngFor="let player of gameState.players" class="player-item">
                <span>{{player.name}}</span>
                <span *ngIf="player.isHost">(Host)</span>
              </div>
            </div>
            <div *ngIf="isHost" class="host-controls">
              <button 
                class="button" 
                (click)="startGame()"
                [disabled]="gameState.players.length < 2">
                Start Game
              </button>
            </div>
          </div>

          <!-- Game In Progress -->
          <div *ngIf="gameState.gamePhase === GamePhase.ROUND_IN_PROGRESS" class="game-wrapper">
            <div class="card">
              <div class="title">
                <h2>Round {{gameState.currentRound}} of {{gameState.totalRounds}}</h2>
              </div>
              
              <div class="timer">
                {{gameState.roundTimeRemaining}}s
              </div>

              <app-gauge
                [(value)]="sliderPosition"
                [disabled]="hasSubmittedGuess"
                [leftLabel]="gameState.currentQuestion.leftConcept"
                [rightLabel]="gameState.currentQuestion.rightConcept"
              ></app-gauge>

              <div style="text-align: center;">
                <button 
                  class="button" 
                  (click)="submitGuess()"
                  [disabled]="hasSubmittedGuess"
                  [class.disabled]="hasSubmittedGuess">
                  {{hasSubmittedGuess ? 'Waiting for others...' : 'Submit Guess'}}
                </button>
              </div>
            </div>

            <div class="card">
              <h3 class="title">Players</h3>
              <div class="player-list">
                <div *ngFor="let player of gameState.players" class="player-item">
                  <span>{{player.name}}</span>
                  <span class="score">{{player.score}}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Round Results -->
          <div *ngIf="gameState.gamePhase === GamePhase.SHOWING_RESULTS" class="card">
            <h2 class="title">Round Results</h2>
            <div class="correct-position">
              Correct Position: {{gameState.roundResults?.correctPosition}}
            </div>
            <app-gauge
              [value]="gameState.roundResults?.correctPosition || 50"
              [disabled]="true"
              [leftLabel]="gameState.currentQuestion.leftConcept"
              [rightLabel]="gameState.currentQuestion.rightConcept"
            ></app-gauge>
            <div class="results">
              <div *ngFor="let guess of gameState.roundResults?.playerGuesses" class="player-guess">
                <span>{{guess.playerName}}</span>
                <span>Position: {{guess.position}}</span>
                <span class="guess-score">+{{guess.score}}</span>
              </div>
            </div>
            <div *ngIf="isHost" class="host-controls">
              <button class="button" (click)="nextRound()">
                {{gameState.currentRound === gameState.totalRounds ? 'End Game' : 'Next Round'}}
              </button>
            </div>
          </div>

          <!-- Game Over -->
          <div *ngIf="gameState.gamePhase === GamePhase.GAME_OVER" class="card">
            <h2 class="title">Game Over!</h2>
            <div class="player-list">
              <div *ngFor="let player of sortedPlayers" class="player-item">
                <span>{{player.name}}</span>
                <span class="score">{{player.score}}</span>
              </div>
            </div>
            <div *ngIf="isHost" class="host-controls">
              <button class="button" (click)="startNewGame()">
                Start New Game
              </button>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class GameBoardComponent implements OnInit, OnDestroy {
  gameState: GameState | null = null;
  sliderPosition = 50;
  GamePhase = GamePhase;
  hasSubmittedGuess = false;
  private gameStateSubscription?: Subscription;

  constructor(private webSocketService: WebSocketService) {
    console.log('GameBoardComponent constructed');
  }

  ngOnInit(): void {
    console.log('GameBoardComponent initializing');
    this.gameStateSubscription = this.webSocketService.getGameState().subscribe({
      next: (state) => {
        console.log('Received game state:', state);
        this.gameState = state;
        if (state?.gamePhase === GamePhase.ROUND_IN_PROGRESS) {
          this.hasSubmittedGuess = false;
        }
      },
      error: (error) => {
        console.error('Error receiving game state:', error);
      }
    });
  }

  ngOnDestroy(): void {
    console.log('GameBoardComponent destroying');
    this.gameStateSubscription?.unsubscribe();
  }

  onSliderChange(value: number): void {
    this.sliderPosition = value;
  }

  submitGuess(): void {
    if (!this.hasSubmittedGuess) {
      console.log('Submitting guess:', this.sliderPosition);
      this.webSocketService.submitGuess(this.sliderPosition);
      this.hasSubmittedGuess = true;
    }
  }

  startGame(): void {
    console.log('Starting game');
    this.webSocketService.startGame();
  }

  nextRound(): void {
    console.log('Moving to next round');
    this.webSocketService.nextRound();
  }

  startNewGame(): void {
    console.log('Starting new game');
    this.webSocketService.startNewGame();
  }

  get isHost(): boolean {
    return this.gameState?.players.some(p => p.id === this.webSocketService.playerId && p.isHost) ?? false;
  }

  get sortedPlayers(): Player[] {
    return [...(this.gameState?.players || [])].sort((a, b) => b.score - a.score);
  }
} 