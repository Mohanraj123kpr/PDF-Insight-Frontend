import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress',
  imports: [CommonModule],
  template: `
    <div class="progress-section">
      <div class="progress-content">
        <div class="progress-icon">📄</div>
        <h3>Uploading PDF</h3>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progress"></div>
        </div>
        <span class="progress-text">{{progress}}%</span>
      </div>
    </div>
  `,
  styleUrls: ['./progress.component.scss']
})
export class ProgressComponent {
  @Input() progress: number = 0;
}