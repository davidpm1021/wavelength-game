import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../services/websocket.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player-join',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 class="text-2xl font-bold mb-6 text-center">Join Wavelength Game</h1>
        <form (ngSubmit)="onJoin()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Your Name</label>
            <input
              type="text"
              [(ngModel)]="playerName"
              name="playerName"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter your name"
            >
          </div>
          <button
            type="submit"
            [disabled]="!playerName"
            class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            Join Game
          </button>
        </form>
      </div>
    </div>
  `
})
export class PlayerJoinComponent {
  playerName: string = '';

  constructor(
    private webSocketService: WebSocketService,
    private router: Router
  ) {}

  onJoin() {
    if (this.playerName.trim()) {
      this.webSocketService.joinGame(this.playerName);
      this.router.navigate(['/game']);
    }
  }
} 