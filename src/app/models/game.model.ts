export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  hasSubmitted: boolean;
  bestAccuracy?: number;  // Best accuracy percentage achieved
  averageAccuracy?: number;  // Average accuracy percentage across all rounds
  guessHistory?: number[];  // Array of previous guesses for accuracy tracking
  roundScores: number[];
}

export enum GamePhase {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  ROUND_IN_PROGRESS = 'ROUND_IN_PROGRESS',
  SHOWING_RESULTS = 'SHOWING_RESULTS',
  GAME_OVER = 'GAME_OVER'
}

export interface Question {
  text: string;
  correctPosition: number;
  minValue: number;
  maxValue: number;
  leftConcept: string;
  rightConcept: string;
}

export interface GameState {
  players: Player[];
  gamePhase: GamePhase;
  currentRound: number;
  currentQuestion?: Question;
  isGameStarted: boolean;
}

export interface RoundResult {
  correctPosition: number;
  playerGuesses: PlayerGuess[];
  roundScores: { [playerId: string]: number };
}

export interface PlayerGuess {
  playerId: string;
  playerName: string;
  position: number;
  score: number;
} 