export interface Player {
    id: string;
    name: string;
    score: number;
    isHost: boolean;
}

export interface GameState {
    players: Player[];
    currentRound: number;
    totalRounds: number;
    isGameStarted: boolean;
    currentQuestion?: {
        leftConcept: string;
        rightConcept: string;
        correctPosition: number;
    };
} 