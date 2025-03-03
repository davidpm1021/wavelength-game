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
    :host {
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --secondary: #0ea5e9;
      --accent: #8b5cf6;
      --success: #22c55e;
      --warning: #f59e0b;
      --error: #ef4444;
      --background: #f8fafc;
      --card: #ffffff;
      --text: #1e293b;
      --text-secondary: #64748b;
      --border: #e2e8f0;

      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--background), #eef2ff);
      padding: 2rem;
    }

    .game-container {
      max-width: 800px;
      margin: 0 auto;
      background: var(--card);
      border-radius: 1.5rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .game-header {
      background: linear-gradient(to right, var(--primary), var(--secondary));
      padding: 2rem;
      color: white;
      text-align: center;
    }

    .game-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .game-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-top: 0.5rem;
    }

    .game-content {
      padding: 2rem;
    }

    .player-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: var(--background);
      border-radius: 1rem;
      box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
    }

    .player {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      background: var(--card);
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }

    .player-avatar {
      width: 2.5rem;
      height: 2.5rem;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1.2rem;
      text-transform: uppercase;
    }

    .player-name {
      font-weight: 600;
      color: var(--text);
    }

    .player-score {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .game-status {
      text-align: center;
      margin: 2rem 0;
      padding: 1rem;
      background: var(--background);
      border-radius: 1rem;
      color: var(--text);
      font-weight: 600;
    }

    .submit-container {
      text-align: center;
      margin-top: 2rem;
      position: relative;
      z-index: 1000;
    }

    button {
      background: linear-gradient(to right, var(--primary), var(--primary-hover));
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
      position: relative;
      z-index: 1000;
      pointer-events: all;
    }

    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgb(0 0 0 / 0.15);
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      background: var(--text-secondary);
    }

    .round-info {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin: 2rem 0;
      padding: 1rem;
      background: var(--background);
      border-radius: 1rem;
      box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
    }

    .round-stat {
      text-align: center;
    }

    .round-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }

    .round-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .game-container {
      animation: fadeIn 0.5s ease-out;
    }

    @media (max-width: 640px) {
      :host {
        padding: 1rem;
      }

      .game-container {
        border-radius: 1rem;
      }

      .game-header {
        padding: 1.5rem;
      }

      .game-title {
        font-size: 1.5rem;
      }

      .player-info {
        flex-direction: column;
        gap: 1rem;
      }

      .round-info {
        flex-direction: column;
        gap: 1rem;
      }
    }

    .results-info {
      margin-top: 1rem;
      padding: 1.5rem;
      background: var(--card);
      border-radius: 0.75rem;
      box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
      animation: slideIn 0.5s ease-out;
    }

    .score-display {
      margin: 0.75rem 0;
      font-size: 1.1rem;
      color: var(--text);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .score-breakdown {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin: 1rem 0;
      padding: 1rem;
      background: var(--background);
      border-radius: 0.5rem;
    }

    .score-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
      text-align: center;
      animation: pulseScore 0.5s ease-out;
    }

    .score-detail {
      font-size: 0.9rem;
      color: var(--text-secondary);
      text-align: center;
    }

    .accuracy-bar {
      width: 100%;
      height: 0.5rem;
      background: var(--background);
      border-radius: 1rem;
      margin: 0.5rem 0;
      position: relative;
      overflow: hidden;
    }

    .accuracy-fill {
      height: 100%;
      background: linear-gradient(to right, var(--error), var(--warning), var(--success));
      border-radius: 1rem;
      transition: width 1s ease-out;
    }

    .value-comparison {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin: 0.5rem 0;
    }

    .value-box {
      padding: 0.5rem 1rem;
      background: var(--background);
      border-radius: 0.5rem;
      font-weight: 600;
      min-width: 80px;
      text-align: center;
    }

    .value-arrow {
      color: var(--text-secondary);
      font-size: 1.2rem;
    }

    @keyframes slideIn {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes pulseScore {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .leaderboard {
      margin: 2rem auto;
      max-width: 600px;
      background: var(--card);
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      animation: slideIn 0.5s ease-out;
    }

    .leaderboard-title {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--border);
    }

    .player-rank {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      margin: 0.5rem 0;
      background: var(--background);
      border-radius: 0.75rem;
      transition: transform 0.2s ease;
    }

    .player-rank:hover {
      transform: translateX(4px);
    }

    .rank-number {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary);
      min-width: 2rem;
      text-align: center;
    }

    .player-stats-container {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .player-stats-header {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .final-score {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
    }

    .game-summary {
      text-align: center;
      margin: 2rem 0;
      padding: 1rem;
      background: var(--background);
      border-radius: 1rem;
      color: var(--text);
    }

    .summary-stat {
      display: inline-block;
      margin: 0.5rem 1rem;
      padding: 0.5rem 1rem;
      background: var(--card);
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
    }

    .summary-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .summary-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary);
      margin-top: 0.25rem;
    }

    .winner-trophy {
      font-size: 2rem;
      margin-bottom: 1rem;
      animation: bounce 1s infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .tutorial-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1100;
      animation: fadeIn 0.3s ease-out;
    }

    .tutorial-card {
      background: var(--card);
      border-radius: 1.5rem;
      padding: 2rem;
      max-width: 600px;
      width: 90%;
      box-shadow: 0 8px 16px rgb(0 0 0 / 0.2);
      position: relative;
    }

    .tutorial-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .tutorial-step {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--background);
      border-radius: 1rem;
    }

    .step-number {
      background: var(--primary);
      color: white;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
    }

    .step-title {
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .step-description {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .tutorial-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .skip-button {
      background: var(--background);
      color: var(--text);
    }

    .players-list {
      margin-top: 2rem;
      padding: 1rem;
      background: var(--background);
      border-radius: 1rem;
      box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
    }

    .players-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }

    .players-header h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
      margin: 0;
    }

    .player-stats-container {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .player-stats-header {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .player-count, .submitted-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
      padding: 0.25rem 0.75rem;
      background: var(--card);
      border-radius: 1rem;
      white-space: nowrap;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    }

    .players-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 0.75rem;
      max-height: 200px;
      overflow-y: auto;
      padding: 0.5rem;
      padding-right: 1rem;
    }

    .players-grid::-webkit-scrollbar {
      width: 6px;
    }

    .players-grid::-webkit-scrollbar-track {
      background: transparent;
    }

    .players-grid::-webkit-scrollbar-thumb {
      background: var(--text-secondary);
      border-radius: 3px;
    }

    .player-list-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--card);
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      transition: all 0.2s ease;
    }

    .player-list-item.has-submitted {
      opacity: 0.6;
      background: var(--background);
    }

    .player-list-info {
      min-width: 0;
      line-height: 1.4;
    }

    .player-list-name {
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .player-list-score {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .submission-status {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }

    .status-icon {
      font-size: 1rem;
      color: var(--text-secondary);
      transition: color 0.2s ease;
    }

    .status-icon.submitted {
      color: var(--success);
    }

    .current-player {
      border: 2px solid var(--primary);
    }

    @media (max-width: 640px) {
      .players-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        max-height: 150px;
      }

      .player-list-item {
        padding: 0.5rem 0.75rem;
      }

      .player-avatar {
        width: 2rem;
        height: 2rem;
        font-size: 1rem;
      }

      .players-header {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }

      .player-stats-container {
        width: 100%;
        justify-content: space-between;
      }
    }

    .current-question {
      background: var(--card);
      padding: 1.5rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
    }

    .current-question h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
      margin: 0;
      text-align: center;
      line-height: 1.5;
    }

    .question-debug {
      margin-top: 1rem;
      padding: 0.5rem;
      background: var(--background);
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.875rem;
      color: var(--text-secondary);
      white-space: pre-wrap;
      word-break: break-all;
    }

    .concepts-container {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
      padding: 0 1rem;
    }

    .concept {
      font-size: 0.875rem;
      color: var(--text-secondary);
      padding: 0.5rem 1rem;
      background: var(--background);
      border-radius: 0.5rem;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    }

    .concept.left {
      margin-right: auto;
    }

    .concept.right {
      margin-left: auto;
    }

    @media (max-width: 640px) {
      .concepts-container {
        padding: 0 0.5rem;
      }

      .concept {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
      }
    }
  `],
  template: `
    <div class="game-container">
      <div class="game-header">
        <h1 class="game-title">Wavelength</h1>
        <div class="game-subtitle">Find the sweet spot!</div>
      </div>

      <div class="game-content">
        <div class="round-info">
          <div class="round-stat">
            <div class="round-label">Round</div>
            <div class="round-value">{{ getCurrentRound() }}</div>
          </div>
        </div>

        <div class="game-status">
          <ng-container [ngSwitch]="gameState?.gamePhase">
            <div *ngSwitchCase="GamePhase.ROUND_IN_PROGRESS" class="current-question">
              <h3>{{ getCurrentQuestion() }}</h3>
              <div class="question-debug" *ngIf="!gameState?.currentQuestion?.text">
                <small>Debug: {{ gameState?.currentQuestion | json }}</small>
              </div>
            </div>
            
            <div *ngSwitchCase="GamePhase.WAITING_FOR_PLAYERS">
              Waiting for players...
            </div>

            <div *ngSwitchCase="GamePhase.SHOWING_RESULTS" class="results-info">
              <div class="score-value">{{ getRoundScore() }}</div>
              <div class="score-detail">points earned this round</div>
              
              <div class="score-breakdown">
                <div class="value-comparison">
                  <div class="value-box">Your Guess: {{ formatValue(sliderValue) }}</div>
                  <div class="value-arrow">→</div>
                  <div class="value-box">Target: {{ formatValue(getTargetValue()) }}</div>
                </div>
              </div>
              
              <div class="score-detail">
                Distance from target: {{ getDistancePercentage() }}%
              </div>
              
              <div class="accuracy-bar">
                <div class="accuracy-fill" [style.width.%]="getAccuracyPercentage()"></div>
              </div>
              
              <div class="score-detail" [style.color]="getAccuracyColor()">
                {{ getAccuracyMessage() }}
              </div>
            </div>

            <div *ngSwitchCase="GamePhase.GAME_OVER" class="leaderboard">
              <div class="winner-trophy">🏆</div>
              <div class="leaderboard-title">Game Over!</div>
              
              <div class="game-summary">
                <div class="summary-stat">
                  <div class="summary-label">Final Score</div>
                  <div class="summary-value">{{ getCurrentScore() }}</div>
                </div>
                <div class="summary-stat">
                  <div class="summary-label">Best Accuracy</div>
                  <div class="summary-value">{{ getBestAccuracy() | number:'1.0-1' }}%</div>
                </div>
                <div class="summary-stat">
                  <div class="summary-label">Average Accuracy</div>
                  <div class="summary-value">{{ getAverageAccuracy() | number:'1.0-1' }}%</div>
                </div>
              </div>

              <div *ngFor="let player of sortedPlayers; let i = index" class="player-rank">
                <div class="rank-number">#{{ i + 1 }}</div>
                <div class="player-stats-container">
                  <div class="player-list-name">{{ player.name }}</div>
                  <div class="final-score">{{ player.score }} points</div>
                </div>
              </div>
            </div>
          </ng-container>
        </div>

        <div *ngIf="gameState?.currentQuestion" class="game-content">
          <div class="concepts-container">
            <div class="concept left">{{ gameState?.currentQuestion?.leftConcept }}</div>
            <div class="concept right">{{ gameState?.currentQuestion?.rightConcept }}</div>
          </div>
          
          <app-gauge
            [value]="sliderValue"
            [disabled]="!canSubmitGuess"
            [leftLabel]="gameState?.currentQuestion?.leftConcept || ''"
            [rightLabel]="gameState?.currentQuestion?.rightConcept || ''"
            [displayValue]="getDisplayValue()"
            (valueChange)="onGaugeValueChange($event)">
          </app-gauge>

          <div class="submit-container">
              <button 
                (click)="submitGuess()"
              [disabled]="!canSubmitGuess">
                Submit Guess
              </button>
            </div>
          </div>

        <div class="players-list">
          <div class="players-header">
            <h3>Players</h3>
            <div class="player-stats-header">
              <span class="player-count">{{ gameState?.players?.length || 0 }}/30</span>
              <span class="submitted-count" *ngIf="gameState?.gamePhase === GamePhase.ROUND_IN_PROGRESS">
                Submitted: {{ getSubmittedCount() }}/{{ gameState?.players?.length || 0 }}
              </span>
            </div>
          </div>
          <div class="players-grid">
            <div *ngFor="let player of gameState?.players" 
                 class="player-list-item" 
                 [class.current-player]="player.id === webSocketService.playerId"
                 [class.has-submitted]="player.hasSubmitted">
              <div class="player-avatar">{{ getPlayerInitials(player.name) }}</div>
              <div class="player-list-info">
                <div class="player-list-name">{{ player.name }}</div>
                <div class="player-list-score">Score: {{ player.score || 0 }}</div>
              </div>
              <div class="submission-status" *ngIf="gameState?.gamePhase === GamePhase.ROUND_IN_PROGRESS">
                <span class="status-icon" [class.submitted]="player.hasSubmitted">
                  {{ player.hasSubmitted ? '✓' : '...' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="showStartPrompt" class="tutorial-overlay">
      <div class="tutorial-card">
        <h2 class="tutorial-title">How to Play Wavelength</h2>
        
        <div class="tutorial-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">Read the Question</div>
            <div class="step-description">Each round presents a question about where a concept falls on a scale from 0 to 100.</div>
          </div>
        </div>

        <div class="tutorial-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-title">Make Your Guess</div>
            <div class="step-description">Use the slider to indicate where you think the correct answer lies on the scale. Trust your intuition!</div>
          </div>
        </div>

        <div class="tutorial-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-title">Score Points</div>
            <div class="step-description">The closer your guess is to the correct answer, the more points you'll earn. A perfect guess earns 100 points!</div>
          </div>
        </div>

        <div class="tutorial-buttons">
          <button class="skip-button" (click)="skipTutorial()">Skip Tutorial</button>
          <button (click)="skipTutorial()">Start Playing!</button>
        </div>
      </div>
    </div>
  `
})
export class GameBoardComponent implements OnInit, OnDestroy {
  private gameStateSubscription: Subscription;
  gameState: GameState | null = null;
  currentPlayer: Player | null = null;
  sliderValue: number = 50;
  currentQuestionId: string | null = null;
  canSubmitGuess: boolean = true;
  GamePhase = GamePhase;
  debugLogs: string[] = [];
  targetValue: number = 0;
  showStartPrompt = false;

  constructor(public webSocketService: WebSocketService) {
    this.gameStateSubscription = this.webSocketService.getGameState().subscribe(
      (state: GameState | null) => {
        this.gameState = state;
        if (state) {
          this.currentPlayer = state.players.find(
            (p: Player) => p.id === this.webSocketService.playerId
          ) || null;
        }
      }
    );
  }

  ngOnInit() {
    this.webSocketService.getGameState().subscribe(state => {
      const oldQuestionId = this.currentQuestionId;
      const oldPhase = this.gameState?.gamePhase;
      const oldRound = this.gameState?.currentRound;
      
      this.gameState = state;
      
      // Enhanced logging
      this.addDebugLog('State Update', {
        phase: state?.gamePhase,
        round: state?.currentRound,
        oldRound,
        oldPhase,
        allSubmitted: this.haveAllPlayersSubmitted()
      });
      
      if (state?.currentQuestion) {
        const newQuestionId = `${state.currentRound}-${state.currentQuestion.text}`;
        
        if (oldQuestionId !== newQuestionId) {
          this.addDebugLog('New question', {
            oldQuestionId,
            newQuestionId,
            currentSliderValue: this.sliderValue
          });
          
          this.currentQuestionId = newQuestionId;
          this.sliderValue = 50;
          this.canSubmitGuess = true;
        }
      }

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

  ngOnDestroy() {
    if (this.gameStateSubscription) {
      this.gameStateSubscription.unsubscribe();
    }
  }

  onGaugeValueChange(value: number): void {
    if (this.gameState?.gamePhase === GamePhase.ROUND_IN_PROGRESS && !this.currentPlayer?.hasSubmitted) {
      this.webSocketService.submitGuess(value);
      this.canSubmitGuess = false;
    }
  }

  getCurrentRound(): string {
    if (!this.gameState) return '0/0';
    const currentRound = this.gameState.currentRound || 0;
    const totalRounds = this.gameState.totalRounds || 5;
    return `${currentRound}/${totalRounds}`;
  }

  private checkEndGameCondition(currentRound: number): boolean {
    return currentRound >= 5;
  }

  getTimeRemaining(): string {
    const timeRemaining = this.gameState?.roundTimeRemaining || 0;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getCurrentQuestion(): string {
    return this.gameState?.currentQuestion?.text || 'Waiting for question...';
  }

  getCurrentScore(): number {
    if (!this.currentPlayer) return 0;
    
    // Use the server-provided total score
    const score = this.currentPlayer.score || 0;
    console.log('[FRONTEND_CURRENT_SCORE_DISPLAY]', {
      playerId: this.currentPlayer.id,
      playerName: this.currentPlayer.name,
      totalScore: score,
      roundScores: this.currentPlayer.roundScores,
      timestamp: new Date().toISOString(),
      rawScore: score
    });
    return Math.round(score);
  }

  getRoundScore(): number {
    if (!this.gameState?.roundResults?.roundScores || !this.currentPlayer?.id) {
      return 0;
    }
    
    // Use the server-provided round score
    const score = this.gameState.roundResults.roundScores[this.currentPlayer.id] || 0;
    
    console.log('[FRONTEND_ROUND_SCORE_DISPLAY]', {
      playerId: this.currentPlayer.id,
      playerName: this.currentPlayer.name,
      roundScore: score,
      roundResults: this.gameState.roundResults,
      currentRound: this.gameState.currentRound,
      timestamp: new Date().toISOString()
    });
    
    return score;
  }

  getBestAccuracy(): number {
    return this.currentPlayer?.bestAccuracy || 0;
  }

  getAverageAccuracy(): number {
    return this.currentPlayer?.averageAccuracy || 0;
  }

  hasSubmitted(): boolean {
    return Boolean(this.currentPlayer?.hasSubmitted);
  }

  get isHost(): boolean {
    return this.gameState?.players.some(
      p => p.id === this.webSocketService.playerId && p.isHost
    ) ?? false;
  }

  get sortedPlayers(): Player[] {
    if (!this.gameState?.players) return [];
    
    // Sort players by their server-provided scores
    const players = [...this.gameState.players].sort((a, b) => 
      (b.score || 0) - (a.score || 0)
    );
    
    console.log('[FRONTEND_LEADERBOARD_UPDATE]', {
      players: players.map(p => ({
        name: p.name,
        totalScore: p.score,
        roundScores: p.roundScores
      })),
      timestamp: new Date().toISOString()
    });
    
    return players;
  }

  get gameStatus(): string {
    if (!this.gameState) {
      return 'Connecting to game...';
    }

    switch (this.gameState.gamePhase) {
      case GamePhase.WAITING_FOR_PLAYERS:
        return 'Waiting for players...';
      case GamePhase.ROUND_IN_PROGRESS:
        return this.getCurrentQuestion();
      case GamePhase.SHOWING_RESULTS:
        return 'Round Results';
      case GamePhase.GAME_OVER:
        return 'Game Over!';
      default:
        return '';
    }
  }

  getDistancePercentage(): number {
    if (!this.gameState?.currentQuestion) return 0;
    
    const currentQuestion = this.gameState.currentQuestion;
    const min = currentQuestion.minValue || 0;
    const max = currentQuestion.maxValue || 100;
    const range = max - min;
    
    // Convert both values to the actual scale before calculating distance
    const actualGuess = min + (this.sliderValue / 100) * range;
    const targetValue = currentQuestion.correctPosition;
    const distance = Math.abs(actualGuess - targetValue);
    return Math.round((distance / range) * 100);
  }

  getAccuracyPercentage(): number {
    if (!this.gameState?.currentQuestion) return 0;
    return Math.max(0, 100 - this.getDistancePercentage());
  }

  getAccuracyColor(): string {
    const accuracy = this.getAccuracyPercentage();
    if (accuracy >= 90) return 'var(--success)';
    if (accuracy >= 70) return 'var(--warning)';
    return 'var(--error)';
  }

  getAccuracyMessage(): string {
    const accuracy = this.getAccuracyPercentage();
    if (accuracy >= 90) return 'Excellent! Nearly perfect!';
    if (accuracy >= 70) return 'Good job! Getting closer!';
    if (accuracy >= 50) return 'Not bad, keep trying!';
    return 'Room for improvement!';
  }

  getTargetValue(): number {
    if (!this.gameState?.currentQuestion) return 0;
    
    const question = this.gameState.currentQuestion;
    const correctPosition = question.correctPosition;
    const min = question.minValue || 0;
    const max = question.maxValue || 100;
    
    // Convert the correct position to a percentage
    const percentage = ((correctPosition - min) / (max - min)) * 100;
    console.log('GameBoard: Target value calculation', {
      correctPosition,
      min,
      max,
      percentage: Math.round(percentage)
    });
    return Math.round(Math.max(0, Math.min(100, percentage)));
  }

  getDisplayValue(): string {
    const value = Math.round(this.getDenormalizedValue());
    return value.toString();
  }

  startGame(): void {
    this.showStartPrompt = false;
    this.webSocketService.startGame();
  }

  nextRound(): void {
    this.webSocketService.nextRound();
  }

  startNewGame(): void {
    this.webSocketService.startNewGame();
  }

  getSubmittedCount(): number {
    if (!this.gameState || !this.gameState.players) return 0;
    return this.gameState.players.filter(p => p.hasSubmitted).length;
  }

  getPlayerInitials(name: string): string {
    if (!name) return '';
    return name.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatValue(value: number): string {
    if (!this.gameState?.currentQuestion) return value.toString();
    
    const question = this.gameState.currentQuestion;
    const min = question.minValue || 0;
    const max = question.maxValue || 100;
    
    // Convert percentage to actual value
    const actualValue = min + (value / 100) * (max - min);
    const roundedValue = Math.round(Math.max(min, Math.min(max, actualValue)));
    
    // Add appropriate units based on question type or text content
    if (question.text.toLowerCase().includes('word count') || 
        question.text.toLowerCase().includes('words were') ||
        question.text.toLowerCase().includes('total words')) {
      return `${roundedValue} words`;
    } else if (question.text.toLowerCase().includes('activities')) {
      return `${roundedValue} activities`;
    } else if (question.text.toLowerCase().includes('percentage')) {
      return `${roundedValue}%`;
    }
    
    return roundedValue.toString();
  }

  haveAllPlayersSubmitted(): boolean {
    return Boolean(this.gameState?.players?.every(player => player.hasSubmitted));
  }

  private updatePlayerScores(): void {
    if (!this.gameState?.players || !this.gameState.currentQuestion) return;

    const currentPlayer = this.gameState.players.find(
      p => p.id === this.webSocketService.playerId
    );

    if (currentPlayer) {
      console.log('[FRONTEND_SCORE_UPDATE]', {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        totalScore: currentPlayer.score,
        roundScores: currentPlayer.roundScores,
        currentRound: this.gameState.currentRound,
        question: this.gameState.currentQuestion,
        roundResults: this.gameState.roundResults,
        timestamp: new Date().toISOString()
      });
    }
  }

  private addDebugLog(message: string, data?: any): void {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    let logMessage = `${timestamp} - ${message}`;
    
    if (data) {
      try {
        const safeData = JSON.parse(JSON.stringify(data));
        logMessage += ': ' + JSON.stringify(safeData);
      } catch (e) {
        logMessage += ': [Circular data structure]';
      }
    }
    
    this.debugLogs.unshift(logMessage);
    
    // Keep only the last 20 logs
    while (this.debugLogs.length > 20) {
      this.debugLogs.pop();
    }
  }

  skipTutorial(): void {
    this.showStartPrompt = false;
    if (this.isHost) {
      this.startGame();
    }
  }

  submitGuess(): void {
    if (!this.canSubmitGuess || !this.gameState?.currentQuestion) return;
    
    const question = this.gameState.currentQuestion;
    const min = question.minValue || 0;
    const max = question.maxValue || 100;
    const range = max - min;
    
    // Convert slider value (0-100) to actual value in question's range
    const actualValue = min + (this.sliderValue / 100) * range;
    
    console.log('[FRONTEND_SUBMIT_GUESS]', {
      sliderValue: this.sliderValue,
      actualValue,
      questionRange: { min, max },
      currentQuestion: question,
      timestamp: new Date().toISOString()
    });

    this.onGaugeValueChange(actualValue);
  }

  private getDenormalizedValue(): number {
    if (!this.gameState?.currentQuestion) return 0;
    
    const question = this.gameState.currentQuestion;
    const min = question.minValue || 0;
    const max = question.maxValue || 100;
    const range = max - min;
    
    // Convert from percentage (0-100) back to actual value range
    const denormalized = min + (this.sliderValue / 100) * range;
    console.log('GameBoard: Denormalizing value', {
      sliderValue: this.sliderValue,
      min,
      max,
      denormalized: Math.round(denormalized)
    });
    return Math.round(Math.max(min, Math.min(max, denormalized)));
  }

  onSliderChange(value: string | number): void {
    this.sliderValue = typeof value === 'string' ? parseInt(value, 10) : value;
    this.updatePlayerScores();
  }
} 