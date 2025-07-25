import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import * as pdfjs from "pdfjs-dist";
import { PdfChatService, ChatResponse } from '../services/pdf-chat.service';
import { FileUploadComponent } from '../components/file-upload/file-upload.component';
import { ProgressComponent } from '../components/progress/progress.component';
import { ChatComponent, ChatMessage } from '../components/chat/chat.component';

@Component({
  selector: 'app-pdf-viewer',
  imports: [CommonModule, FormsModule, HttpClientModule, FileUploadComponent, ProgressComponent, ChatComponent],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss'
})

export class PdfViewerComponent {
  @ViewChild('pdfContainer') pdfContainer!: ElementRef<HTMLDivElement>;
  
  totalPages = 0;
  pdfUrl: any = '';
  searchTerm: string = '';
  
  // File upload properties
  pdfLoaded = false;
  isUploading = false;
  uploadProgress = 0;
  fileName = '';
  
  // Zoom properties
  currentScale = 1.0;
  minScale = 0.5;
  maxScale = 3.0;
  currentPdf: any = null;
  
  // Chat properties
  messages: ChatMessage[] = [];
  currentQuestion = '';
  isProcessingQuestion = false;
  
  constructor(private pdfChatService: PdfChatService) {}
  ngOnInit(): void {
    pdfjs.GlobalWorkerOptions.workerSrc = '/assets/js/pdf.worker.min.mjs';
  }

  async loadPdf(pdfUrl: string): Promise<void> {
    const loadingTask = pdfjs.getDocument({
      url: pdfUrl,
      rangeChunkSize: 1024 * 1024,
      disableStream: false,
      disableRange: false
    });

    const pdf = await loadingTask.promise;
    this.totalPages = pdf.numPages;
    console.log("this method is called");
    
    // Render all pages
    for (let pageNumber = 1; pageNumber <= this.totalPages; pageNumber++) {
      this.renderPage(pdf, pageNumber);
    }
  }

  async renderPage(pdf: any, pageNumber: number, scale?: number): Promise<void> {
    const page = await pdf.getPage(pageNumber);

    // Create a new canvas for each page
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    // Use provided scale or calculate responsive scale
    let finalScale = scale || this.currentScale;
    if (!scale) {
      const containerWidth = this.pdfContainer.nativeElement.clientWidth - 40;
      const baseViewport = page.getViewport({ scale: 1 });
      finalScale = Math.min(1.0, containerWidth / baseViewport.width);
      this.currentScale = finalScale;
    }
    
    const viewport = page.getViewport({ scale: finalScale });

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

  // File upload methods
  onFileSelected(file: File): void {
    this.fileName = file.name;
    this.isUploading = true;
    this.simulateUpload(file);
  }

  simulateUpload(file: File): void {
    this.uploadProgress = 0;
    
    // Upload to backend
    this.pdfChatService.uploadPdf(file).subscribe({
      next: (response) => {
        console.log('PDF uploaded successfully:', response);
        this.uploadProgress = 100;
        setTimeout(() => {
          this.isUploading = false;
          this.pdfLoaded = true;
          this.loadPdfFromFile(file);
        }, 500);
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.isUploading = false;
        alert('Failed to upload PDF. Please try again.');
      }
    });
    
    // Simulate progress for UI
    const interval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      } else {
        clearInterval(interval);
      }
    }, 200);
  }

  async loadPdfFromFile(file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      rangeChunkSize: 1024 * 1024,
      disableStream: false,
      disableRange: false
    });

    const pdf = await loadingTask.promise;
    this.currentPdf = pdf;
    this.totalPages = pdf.numPages;
    
    for (let pageNumber = 1; pageNumber <= this.totalPages; pageNumber++) {
      this.renderPage(pdf, pageNumber);
    }
  }

  closePdf(): void {
    this.pdfLoaded = false;
    this.messages = [];
    this.currentQuestion = '';
    this.fileName = '';
    this.currentScale = 1.0;
    this.currentPdf = null;
    if (this.pdfContainer) {
      this.pdfContainer.nativeElement.innerHTML = '';
    }
  }
  
  // Zoom methods
  zoomIn(): void {
    if (this.currentScale < this.maxScale && this.currentPdf) {
      this.currentScale = Math.min(this.maxScale, this.currentScale + 0.25);
      this.rerenderPdf();
    }
  }
  
  zoomOut(): void {
    if (this.currentScale > this.minScale && this.currentPdf) {
      this.currentScale = Math.max(this.minScale, this.currentScale - 0.25);
      this.rerenderPdf();
    }
  }
  
  private rerenderPdf(): void {
    if (this.pdfContainer && this.currentPdf) {
      this.pdfContainer.nativeElement.innerHTML = '';
      for (let pageNumber = 1; pageNumber <= this.totalPages; pageNumber++) {
        this.renderPage(this.currentPdf, pageNumber, this.currentScale);
      }
    }
  }
  
  getZoomPercentage(): number {
    return Math.round(this.currentScale * 100);
  }

  // Chat methods
  onQuestionAsked(question: string): void {
    this.messages.push({
      content: question,
      isUser: true
    });
    
    this.isProcessingQuestion = true;
    
    // Get response from backend
    this.pdfChatService.askQuestion(question).subscribe({
      next: (response: ChatResponse) => {
        this.messages.push({
          content: response.answer,
          isUser: false
        });
        this.isProcessingQuestion = false;
      },
      error: (error) => {
        console.error('Question failed:', error);
        this.messages.push({
          content: 'Sorry, I encountered an error processing your question. Please try again.',
          isUser: false
        });
        this.isProcessingQuestion = false;
      }
    });
  }

  searchText(searchText: any): void {
    const term = this.searchTerm.toLowerCase();
    const textDivs = this.pdfContainer?.nativeElement.querySelectorAll('.textLayer span');

    textDivs?.forEach((div) => {
      const text = div.textContent?.toLowerCase() || '';
      if (text.includes(term) && term) {
        div.classList.add('highlight');
      } else {
        div.classList.remove('highlight');
      }
    });
  }
}
