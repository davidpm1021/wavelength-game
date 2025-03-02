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
    .submit-container {
      position: relative;
      z-index: 1000;
      pointer-events: all;
      margin-top: 2rem;
      padding: 1rem;
      background-color: rgba(255, 255, 255, 0.8);
      border-radius: 0.5rem;
    }
    .button {
      position: relative;
      z-index: 1000;
      pointer-events: all;
      padding: 0.75rem 2rem;
      font-size: 1.1rem;
      border-radius: 0.5rem;
      background-color: #3b82f6;
      color: white;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 200px;
    }
    .button:not(.disabled):hover {
      background-color: #2563eb;
      transform: translateY(-1px);
    }
    .button.disabled {
      opacity: 0.7;
      cursor: not-allowed;
      background-color: #94a3b8;
    }
    .submission-status {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #f8fafc;
      border-radius: 0.5rem;
    }
    .player-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .player-status:last-child {
      border-bottom: none;
    }
    .status-indicator {
      font-weight: 500;
    }
    .status-indicator.submitted {
      color: #22c55e;
    }
  `],
  template: `
    <div class="container">
      <div class="game-content">
        <div *ngIf="!gameState" class="card waiting-room">
          <h2 class="title">Connecting to game server...</h2>
        </div>
        
        <ng-container *ngIf="gameState">
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

              <div class="question-text">
                {{getCurrentQuestionText()}}
              </div>

              <div class="concepts">
                <div class="concept left">
                  {{getCurrentLeftConcept()}}
                </div>
                <div class="concept right">
                  {{getCurrentRightConcept()}}
                </div>
              </div>

              <app-gauge
                [(value)]="sliderPosition"
                [disabled]="hasSubmittedGuess"
                [leftLabel]="getCurrentLeftConcept()"
                [rightLabel]="getCurrentRightConcept()"
              ></app-gauge>

              <div class="submit-container debug-container" 
                style="text-align: center;"
                (mousedown)="onContainerMouseDown()"
                (click)="onContainerClick($event)">
                <button 
                  #submitButton
                  class="button debug-button"
                  [class.disabled]="hasSubmittedGuess"
                  [disabled]="hasSubmittedGuess"
                  (mousedown)="onButtonMouseDown($event)"
                  (mouseenter)="onButtonMouseEnter()"
                  (click)="onSubmitClick($event)">
                  {{getSubmitButtonText()}}
                </button>
              </div>

              <!-- Add submission status -->
              <div class="submission-status" *ngIf="hasSubmittedGuess">
                <div *ngFor="let player of gameState.players" class="player-status">
                  <span>{{player.name}}</span>
                  <span class="status-indicator" [class.submitted]="player.hasSubmitted">
                    {{player.hasSubmitted ? '✓' : 'Waiting...'}}
                  </span>
                </div>
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
  private lastSubmittedRound: number = -1;  // Add this to track submissions per round

  constructor(private webSocketService: WebSocketService) {
    console.log('GameBoard: Constructor - Initial state:', {
      hasSubmittedGuess: this.hasSubmittedGuess,
      lastSubmittedRound: this.lastSubmittedRound
    });
  }

  ngOnInit(): void {
    console.log('GameBoard: Initializing component');
    this.gameStateSubscription = this.webSocketService.getGameState().subscribe({
      next: (state) => {
        console.log('GameBoard: Received new game state:', {
          phase: state?.gamePhase,
          round: state?.currentRound,
          players: state?.players?.map(p => ({
            name: p.name,
            hasSubmitted: p.hasSubmitted,
            id: p.id
          }))
        });

        const previousState = this.gameState;
        this.gameState = state;

        if (state?.gamePhase === GamePhase.ROUND_IN_PROGRESS) {
          const currentPlayer = state.players.find(
            p => p.id === this.webSocketService.playerId
          );
          
          console.log('GameBoard: Current player state:', {
            playerId: this.webSocketService.playerId,
            currentRound: state.currentRound,
            hasSubmitted: currentPlayer?.hasSubmitted,
            localHasSubmitted: this.hasSubmittedGuess
          });

          // Update local submission state based on server state
          this.hasSubmittedGuess = currentPlayer?.hasSubmitted ?? false;

          // Log submission status for all players
          console.log('GameBoard: All players submission status:', 
            state.players.map(p => ({
              name: p.name,
              hasSubmitted: p.hasSubmitted,
              isCurrentPlayer: p.id === this.webSocketService.playerId
            }))
          );
        } else if (state?.gamePhase !== previousState?.gamePhase) {
          // Reset submission state when game phase changes
          console.log('GameBoard: Game phase changed, resetting submission state');
          this.hasSubmittedGuess = false;
          this.lastSubmittedRound = -1;
        }
      },
      error: (error) => {
        console.error('GameBoard: Error receiving game state:', error);
      }
    });
  }

  ngOnDestroy(): void {
    console.log('GameBoard: Component destroying, cleaning up subscription');
    this.gameStateSubscription?.unsubscribe();
  }

  onSliderChange(value: number): void {
    this.sliderPosition = value;
  }

  onSubmitClick(event: MouseEvent): void {
    console.log('GameBoard: Submit button clicked - START', {
      event: {
        type: event.type,
        target: event.target instanceof HTMLButtonElement ? {
          disabled: event.target.disabled,
          classList: Array.from(event.target.classList)
        } : 'not a button',
        timestamp: new Date().toISOString()
      },
      component: {
        hasSubmittedGuess: this.hasSubmittedGuess,
        sliderPosition: this.sliderPosition,
        gamePhase: this.gameState?.gamePhase,
        playerId: this.webSocketService.playerId
      }
    });

    // Check if we can submit
    if (this.hasSubmittedGuess) {
      console.log('GameBoard: Cannot submit - already submitted for this round');
      return;
    }

    if (!this.gameState || this.gameState.gamePhase !== GamePhase.ROUND_IN_PROGRESS) {
      console.log('GameBoard: Cannot submit - game not in progress', {
        gameState: this.gameState?.gamePhase
      });
      return;
    }

    // Set hasSubmittedGuess before making the call to prevent double submissions
    this.hasSubmittedGuess = true;
    console.log('GameBoard: Setting hasSubmittedGuess to true');
    
    console.log('GameBoard: Submitting guess via WebSocket service');
    this.webSocketService.submitGuess(this.sliderPosition);
    console.log('GameBoard: Submit guess call completed');
  }

  onContainerClick(event: MouseEvent): void {
    console.log('GameBoard: Container clicked', {
      target: event.target,
      currentTarget: event.currentTarget,
      eventPhase: event.eventPhase,
      timestamp: new Date().toISOString()
    });
  }

  onButtonMouseDown(event: MouseEvent): void {
    console.log('GameBoard: Button mousedown', {
      target: event.target,
      currentTarget: event.currentTarget,
      timestamp: new Date().toISOString()
    });
  }

  onButtonMouseEnter(): void {
    console.log('GameBoard: Button mouseenter');
  }

  onContainerMouseDown(): void {
    console.log('GameBoard: Container mousedown');
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
    const isHost = this.gameState?.players.some(
      p => p.id === this.webSocketService.playerId && p.isHost
    ) ?? false;
    console.log('GameBoard: Host check:', {
      playerId: this.webSocketService.playerId,
      isHost
    });
    return isHost;
  }

  get sortedPlayers(): Player[] {
    return [...(this.gameState?.players || [])].sort((a, b) => b.score - a.score);
  }

  getCurrentQuestionText(): string {
    if (!this.gameState?.currentQuestion) {
      console.log('No current question available');
      return 'Loading question...';
    }
    console.log('Current question:', this.gameState.currentQuestion);
    return this.gameState.currentQuestion.text || 'Where does this concept fall on the spectrum?';
  }

  getCurrentLeftConcept(): string {
    return this.gameState?.currentQuestion?.leftConcept || 'Left';
  }

  getCurrentRightConcept(): string {
    return this.gameState?.currentQuestion?.rightConcept || 'Right';
  }

  getSubmitButtonText(): string {
    if (!this.gameState) return 'Submit Guess';
    
    const totalPlayers = this.gameState.players.length;
    const submittedPlayers = this.gameState.players.filter(p => p.hasSubmitted).length;
    
    console.log('GameBoard: Button text calculation:', {
      hasSubmittedGuess: this.hasSubmittedGuess,
      totalPlayers,
      submittedPlayers,
      players: this.gameState.players.map(p => ({
        name: p.name,
        hasSubmitted: p.hasSubmitted
      }))
    });

    if (!this.hasSubmittedGuess) {
      return 'Submit Guess';
    }
    return `Waiting for others (${submittedPlayers}/${totalPlayers})`;
  }
} 