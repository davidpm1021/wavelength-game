import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-player-join',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      padding: 2rem;
      color: white;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 3rem;
      align-items: center;
      min-height: 100vh;
      padding: 2rem;
    }

    .logo-section {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .wave-logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #ef4444, #f59e0b, #22c55e);
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M0,50 C25,30 75,70 100,50 C75,70 25,30 0,50 Z' fill='%23000'/%3E%3C/path%3E%3C/svg%3E");
      mask-size: contain;
      mask-repeat: no-repeat;
      animation: wave 3s ease-in-out infinite;
    }

    @keyframes wave {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .title {
      font-size: 3rem;
      font-weight: 800;
      line-height: 1.2;
      margin: 0;
      background: linear-gradient(to right, #ef4444, #f59e0b, #22c55e);
      -webkit-background-clip: text;
      color: transparent;
      animation: gradient 8s linear infinite;
      background-size: 200% auto;
    }

    @keyframes gradient {
      0% { background-position: 0% center; }
      100% { background-position: 200% center; }
    }

    .subtitle {
      font-size: 1.1rem;
      color: #94a3b8;
      max-width: 500px;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .join-section {
      padding: 2rem;
      margin-top: -2rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 1.5rem;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transform-style: preserve-3d;
      perspective: 1000px;
      transition: transform 0.3s ease;
    }

    .join-section:hover {
      transform: translateY(-5px) rotateX(5deg);
    }

    .join-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .input-group {
      margin-bottom: 1.5rem;
    }

    .input-label {
      display: block;
      margin-bottom: 0.5rem;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .name-input {
      width: 100%;
      padding: 1rem;
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .name-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
    }

    .join-button {
      width: 100%;
      padding: 1rem;
      border-radius: 0.75rem;
      background: linear-gradient(to right, #6366f1, #4f46e5);
      color: white;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .join-button::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
      transform: translateX(-100%);
      transition: transform 0.5s ease;
    }

    .join-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -10px rgba(79, 70, 229, 0.5);
    }

    .join-button:hover::after {
      transform: translateX(100%);
    }

    .how-to-play {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 1rem;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-top: 1rem;
    }

    .how-to-play-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #e2e8f0;
      margin-bottom: 1rem;
    }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      color: #94a3b8;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .step {
      display: flex;
      gap: 0.75rem;
      align-items: baseline;
    }

    .step-number {
      color: #6366f1;
      font-weight: 600;
      font-size: 0.8rem;
    }

    @media (max-width: 1024px) {
      .container {
        grid-template-columns: 1fr;
        gap: 2rem;
        height: auto;
        padding: 2rem 0;
      }

      .logo-section {
        text-align: center;
        align-items: center;
      }

      .title {
        font-size: 2.5rem;
      }
    }

    @media (max-width: 640px) {
      :host {
        padding: 1rem;
      }

      .join-section {
        padding: 2rem;
      }

      .title {
        font-size: 2rem;
      }

      .subtitle {
        font-size: 1rem;
      }
    }
  `],
  template: `
    <div class="container">
      <div class="logo-section">
        <div class="wave-logo"></div>
        <h1 class="title">Wavelength</h1>
        <p class="subtitle">
          Test your knowledge and intuition in this multiplayer guessing game.
        </p>
        <div class="how-to-play">
          <div class="how-to-play-title">How to Play</div>
          <div class="steps">
            <div class="step">
              <div class="step-number">1.</div>
              <div>Enter your name and join a game with friends</div>
            </div>
            <div class="step">
              <div class="step-number">2.</div>
              <div>Each round presents a question about a specific value</div>
            </div>
            <div class="step">
              <div class="step-number">3.</div>
              <div>Use the gauge to make your best guess</div>
            </div>
            <div class="step">
              <div class="step-number">4.</div>
              <div>Score points based on how close you get to the correct answer</div>
            </div>
          </div>
        </div>
      </div>

      <div class="join-section">
        <h2 class="join-title">Join the Game</h2>
        <div class="input-group">
          <label class="input-label" for="playerName">Your Name</label>
          <input 
            id="playerName"
            class="name-input" 
            type="text" 
            [(ngModel)]="playerName" 
            placeholder="Enter your name"
            (keyup.enter)="joinGame()"
          >
        </div>
        <button 
          class="join-button" 
          (click)="joinGame()"
          [disabled]="!playerName?.trim()">
          Start Playing
        </button>
      </div>
    </div>
  `
})
export class PlayerJoinComponent implements OnInit {
  playerName: string = '';

  constructor(
    private webSocketService: WebSocketService,
    private router: Router
  ) {}

  ngOnInit() {
    // Add any initialization logic here
  }

  joinGame() {
    if (!this.playerName?.trim()) return;
    
    this.webSocketService.joinGame(this.playerName.trim());
    this.router.navigate(['/game']);
  }
} 