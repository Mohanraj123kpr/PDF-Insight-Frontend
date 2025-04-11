import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as pdfjs from "pdfjs-dist";

@Component({
  selector: 'app-pdf-viewer',
  imports: [],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss'
})

export class PdfViewerComponent {
  @ViewChild('pdfContainer', { static: true }) pdfContainer!: ElementRef<HTMLDivElement>;
  totalPages = 0;
  pdfUrl: any = '';
  ngOnInit(): void {
    // Set the workerSrc to the copied worker file
    pdfjs.GlobalWorkerOptions.workerSrc = '/assets/js/pdf.worker.min.mjs';
    this.pdfUrl = "https://mpc-engdev-mpcbase.s3.amazonaws.com/mpc-mpc-77b50/input/ocr/SRG_op.pdf?response-content-disposition=inline%3B%20filename%3D%22SRG_op.pdf%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA2A6SQSYB4DLSHSZ6%2F20250411%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20250411T063228Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=473ea28762d7bdfc67b909e4c2efd0db35488e0710a59011f42c2def7951fb5f";
    const samplePdf = "assets/pdf/sample.pdf"; // Path to your sample PDF file
    // Load and render the PDF
    this.loadPdf(this.pdfUrl);
  }

  async loadPdf(pdfUrl: string): Promise<void> {
    const loadingTask = pdfjs.getDocument({
      url: pdfUrl,
      rangeChunkSize: 1048576, // Enable range requests
      disableStream: false,
      disableRange: false
    });

    const pdf = await loadingTask.promise;
    this.totalPages = pdf.numPages;

    // Render all pages
    for (let pageNumber = 1; pageNumber <= this.totalPages; pageNumber++) {
      this.renderPage(pdf, pageNumber);
    }
  }

  async renderPage(pdf: any, pageNumber: number): Promise<void> {
    const page = await pdf.getPage(pageNumber);

    // Create a new canvas for each page
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const viewport = page.getViewport({ scale: 1.5 });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    // Append the canvas to the container
    this.pdfContainer.nativeElement.appendChild(canvas);
  }
}
