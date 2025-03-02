import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gauge',
  standalone: true,
  imports: [CommonModule],
  styles: [`
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
        from 180deg,
        #ef4444 0%,     /* Red */
        #f97316 20%,    /* Orange */
        #facc15 40%,    /* Yellow */
        #84cc16 60%,    /* Light green */
        #22c55e 80%,    /* Green */
        #15803d 100%    /* Dark green */
      );
      cursor: pointer;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .gauge-arc::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      background: white;
      border-radius: 190px 190px 0 0;
    }

    .gauge-needle {
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 4px;
      height: 190px;
      background: linear-gradient(to bottom, #1e293b, #475569);
      transform-origin: bottom center;
      transition: transform 0.3s ease;
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
      background: #1e293b;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .gauge-value {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
      z-index: 10;
      background: rgba(0, 0, 0, 0.6);
      padding: 4px 12px;
      border-radius: 12px;
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
      font-weight: bold;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
      background: rgba(0, 0, 0, 0.6);
      padding: 4px 8px;
      border-radius: 8px;
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
      background-color: rgba(255, 255, 255, 0.6);
      transform-origin: bottom center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .gauge-tick.major {
      height: 15px;
      width: 3px;
      background-color: white;
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
        (mouseleave)="stopDragging()">
        <div class="gauge-ticks">
          <div *ngFor="let tick of ticks" 
               class="gauge-tick"
               [class.major]="tick.major"
               [style.transform]="'rotate(' + tick.angle + 'deg)'">
          </div>
        </div>
        <div class="gauge-needle" [style.transform]="'rotate(' + getNeedleRotation() + 'deg)'"></div>
        <div class="gauge-value">{{ value }}</div>
        <div class="gauge-labels">
          <span class="gauge-label">{{ leftLabel }}</span>
          <span class="gauge-label">{{ rightLabel }}</span>
        </div>
      </div>
    </div>
  `
})
export class GaugeComponent implements OnInit {
  @Input() value: number = 50;
  @Input() disabled: boolean = false;
  @Input() leftLabel: string = '';
  @Input() rightLabel: string = '';
  @Output() valueChange = new EventEmitter<number>();

  private isDragging = false;
  ticks: { angle: number; major: boolean }[] = [];

  ngOnInit() {
    // Generate tick marks
    for (let i = 0; i <= 180; i += 4) {
      this.ticks.push({
        angle: i,
        major: i % 20 === 0
      });
    }
  }

  startDragging(event: MouseEvent) {
    if (!this.disabled) {
      this.isDragging = true;
      this.updateValue(event);
    }
  }

  stopDragging() {
    this.isDragging = false;
  }

  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.updateValue(event);
    }
  }

  private updateValue(event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.bottom;
    
    // Calculate relative mouse position from center
    const dx = event.clientX - centerX;
    const dy = centerY - event.clientY;
    
    // Get angle in degrees (atan2 returns angle in radians)
    // Subtract 90 to make 0 degrees point to the right
    let angle = (Math.atan2(dy, dx) * (180 / Math.PI)) - 90;
    
    // Normalize to 0-180 range
    if (angle < -90) angle = -90;
    if (angle > 90) angle = 90;
    
    // Map -90 to 90 range to 100-0 value
    // -90 = 100 (left)
    // 0 = 50 (top)
    // 90 = 0 (right)
    const newValue = Math.round(100 - (((angle + 90) / 180) * 100));
    
    // Add edge detection
    let finalValue = newValue;
    if (newValue <= 5) finalValue = 0;
    if (newValue >= 95) finalValue = 100;
    
    if (this.value !== finalValue) {
        this.value = finalValue;
        this.valueChange.emit(finalValue);
    }
  }

  getNeedleRotation(): number {
    // Convert 0-100 value to -90 to 90 degrees
    // 0 value = -90 degrees (right)
    // 50 value = 0 degrees (up)
    // 100 value = 90 degrees (left)
    return (this.value * 1.8) - 90;  // 1.8 = 180/100
  }
} 