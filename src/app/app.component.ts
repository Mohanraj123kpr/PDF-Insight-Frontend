import { Component } from '@angular/core';
import { PdfViewerComponent } from "./pdf-viewer/pdf-viewer.component";

@Component({
  selector: 'app-root',
  imports: [PdfViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'project1';
}
