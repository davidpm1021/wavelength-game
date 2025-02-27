import { Routes } from '@angular/router';
import { PlayerJoinComponent } from './components/player-join/player-join.component';
import { GameBoardComponent } from './components/game-board/game-board.component';

export const routes: Routes = [
  { path: '', component: PlayerJoinComponent },
  { path: 'game', component: GameBoardComponent },
  { path: '**', redirectTo: '' }
];
