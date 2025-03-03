import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gauge',
  standalone: true,
  imports: [CommonModule],
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
    }

    .gauge-container {
      position: relative;
      width: 100%;
      height: 200px;
      margin: 20px 0;
      user-select: none;
    }

    .gauge-arc {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      height: 200px;
      border-radius: 200px 200px 0 0;
      background: conic-gradient(
        from 0deg at 50% 100%,
        var(--success) 0%,
        var(--success) 20%,
        var(--success) 40%,
        var(--warning) 60%,
        var(--warning) 80%,
        var(--error) 100%
      );
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      transition: opacity 0.3s ease;
    }

    .gauge-arc::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      background: var(--card);
      border-radius: 190px 190px 0 0;
      box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
    }

    .gauge-needle {
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 4px;
      height: 190px;
      background: linear-gradient(to bottom, var(--text), var(--text-secondary));
      transform-origin: bottom center;
      transition: transform 0.1s ease-out;
      border-radius: 2px;
      pointer-events: none;
      z-index: 10;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    }

    .gauge-needle::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: -12px;
      width: 28px;
      height: 28px;
      background: var(--text);
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .gauge-value {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      z-index: 10;
      background: var(--card);
      padding: 0.5rem 1rem;
      border-radius: 1rem;
      box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
      transition: all 0.1s ease-out;
    }

    .gauge-labels {
      position: absolute;
      width: 500px;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      pointer-events: none;
    }

    .gauge-label {
      font-weight: 600;
      color: var(--text);
      background: var(--card);
      padding: 0.5rem 1rem;
      border-radius: 0.75rem;
      box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
      transition: all 0.3s ease;
    }

    .disabled {
      opacity: 0.7;
      pointer-events: none;
      filter: grayscale(30%);
    }

    .gauge-ticks {
      position: absolute;
      width: 420px;
      height: 210px;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
    }

    .gauge-tick {
      position: absolute;
      bottom: 10px;
      left: 50%;
      width: 2px;
      height: 10px;
      background-color: var(--text-secondary);
      transform-origin: bottom center;
      opacity: 0.4;
      transition: opacity 0.3s ease;
    }

    .gauge-tick.major {
      height: 15px;
      width: 3px;
      background-color: var(--text);
      opacity: 0.6;
    }

    /* Hover Effects */
    .gauge-arc:not(.disabled):hover {
      box-shadow: 0 6px 8px -1px rgb(0 0 0 / 0.15);
    }

    .gauge-arc:not(.disabled):hover .gauge-value {
      transform: translateX(-50%) translateY(-2px);
      box-shadow: 0 4px 6px rgb(0 0 0 / 0.15);
    }

    .gauge-arc:not(.disabled):hover .gauge-label {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgb(0 0 0 / 0.15);
    }

    .gauge-arc:not(.disabled):hover .gauge-tick {
      opacity: 0.6;
    }

    .gauge-arc:not(.disabled):hover .gauge-tick.major {
      opacity: 0.8;
    }

    /* Animation */
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }

    .gauge-value {
      animation: pulse 2s infinite;
    }
  `],
  template: `
    <div class="gauge-container">
      <div 
        class="gauge-arc" 
        [class.disabled]="disabled"
        (mousedown)="startDragging($event)"
        (mousemove)="onMouseMove($event)"
        (mouseup)="stopDragging()"
        (mouseleave)="stopDragging()"
        (click)="updateFromClick($event)">
        <div class="gauge-ticks">
          <div *ngFor="let tick of ticks" 
               class="gauge-tick"
               [class.major]="tick.major"
               [style.transform]="'rotate(' + tick.angle + 'deg)'">
          </div>
        </div>
        <div class="gauge-needle" [style.transform]="'rotate(' + getNeedleRotation() + 'deg)'"></div>
        <div class="gauge-value">{{ displayValue }}</div>
        <div class="gauge-labels">
          <span class="gauge-label">{{ leftLabel }}</span>
          <span class="gauge-label">{{ rightLabel }}</span>
        </div>
      </div>
    </div>
  `
})
export class GaugeComponent implements OnInit {
  @Input() value: number = 0;
  @Input() disabled: boolean = false;
  @Input() leftLabel: string = '';
  @Input() rightLabel: string = '';
  @Input() displayValue: string = '';
  @Input() minValue: number = 0;
  @Input() maxValue: number = 100;
  @Output() valueChange = new EventEmitter<number>();

  private isDragging = false;
  private rect: DOMRect | null = null;
  ticks: { angle: number; major: boolean }[] = [];

  ngOnInit() {
    // Generate tick marks every 4 degrees
    for (let i = 0; i <= 180; i += 4) {
      this.ticks.push({
        angle: i,
        major: i % 20 === 0
      });
    }
  }

  startDragging(event: MouseEvent) {
    if (!this.disabled) {
      event.preventDefault(); // Prevent text selection
      this.isDragging = true;
      this.rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.updateFromEvent(event);
    }
  }

  stopDragging() {
    this.isDragging = false;
  }

  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      event.preventDefault();
      this.updateFromEvent(event);
    }
  }

  updateFromClick(event: MouseEvent) {
    if (!this.disabled && !this.isDragging) {
      this.rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.updateFromEvent(event);
    }
  }

  private updateFromEvent(event: MouseEvent) {
    if (!this.rect) {
      console.error('Gauge: No rect available for calculations');
      return;
    }

    const centerX = this.rect.left + this.rect.width / 2;
    const centerY = this.rect.bottom;
    
    const dx = event.clientX - centerX;
    const dy = centerY - event.clientY;
    
    let degrees = Math.atan2(dy, dx) * (180 / Math.PI);
    
    if (degrees < 0) {
      degrees += 360;
    }
    
    if (degrees > 180) {
      degrees = (degrees > 270) ? 0 : 180;
    }
    
    // Convert angle directly to percentage (0-100)
    const percentage = 100 - (degrees / 180 * 100);
    
    // Only emit if value has changed significantly
    if (Math.abs(this.value - percentage) > 0.1 && !isNaN(percentage)) {
      console.log(`Gauge angle: ${degrees}°, Raw percentage: ${percentage}%`);
      this.value = percentage;
      this.valueChange.emit(percentage);
    }
  }

  getNeedleRotation(): number {
    // Convert percentage directly to rotation
    return (180 + (this.value * 1.8)) + 90;
  }
} 