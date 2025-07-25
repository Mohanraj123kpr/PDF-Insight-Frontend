import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import * as pdfjs from "pdfjs-dist";
import { PdfChatService, ChatResponse } from '../services/pdf-chat.service';

interface ChatMessage {
  content: string;
  isUser: boolean;
}

@Component({
  selector: 'app-pdf-viewer',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss'
})

export class PdfViewerComponent {
  @ViewChild('pdfContainer') pdfContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('chatMessages') chatMessages!: ElementRef<HTMLDivElement>;
  
  totalPages = 0;
  pdfUrl: any = '';
  searchTerm: string = '';
  
  // File upload properties
  pdfLoaded = false;
  isUploading = false;
  uploadProgress = 0;
  fileName = '';
  isDragOver = false;
  
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

  // File upload methods
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File): void {
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }
    
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
    if (this.pdfContainer) {
      this.pdfContainer.nativeElement.innerHTML = '';
    }
  }

  // Chat methods
  askQuestion(question: string): void {
    this.currentQuestion = question;
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.currentQuestion.trim() || this.isProcessingQuestion) return;
    
    const question = this.currentQuestion;
    this.messages.push({
      content: question,
      isUser: true
    });
    
    this.currentQuestion = '';
    this.isProcessingQuestion = true;
    this.scrollToBottom();
    
    // Get response from backend
    this.pdfChatService.askQuestion(question).subscribe({
      next: (response: ChatResponse) => {
        this.messages.push({
          content: response.answer,
          isUser: false
        });
        this.isProcessingQuestion = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Question failed:', error);
        this.messages.push({
          content: 'Sorry, I encountered an error processing your question. Please try again.',
          isUser: false
        });
        this.isProcessingQuestion = false;
        this.scrollToBottom();
      }
    });
  }



  scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatMessages) {
        this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
      }
    }, 100);
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
