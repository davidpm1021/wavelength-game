export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  hasSubmitted?: boolean;
}

export interface Question {
  id: string;
  text: string;
  leftConcept: string;
  rightConcept: string;
  correctPosition: number;
  category: string;
  difficulty: string;
  explanation?: string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
}

export interface GameState {
  players: Player[];
  currentRound: number;
  totalRounds: number;
  isGameStarted: boolean;
  currentQuestion: Question;
  gamePhase: GamePhase;
  roundTimeRemaining?: number;  // in seconds
  roundResults?: RoundResult;
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

export enum GamePhase {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  ROUND_IN_PROGRESS = 'ROUND_IN_PROGRESS',
  SHOWING_RESULTS = 'SHOWING_RESULTS',
  GAME_OVER = 'GAME_OVER'
} 