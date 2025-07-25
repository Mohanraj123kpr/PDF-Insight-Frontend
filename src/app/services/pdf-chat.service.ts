import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  answer: string;
  matched_chunks: string[];
}

export interface UploadResponse {
  message: string;
  chunks_count: number;
  filename: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfChatService {
  private baseUrl = 'https://pdf-insight-backend-git-main-mohanraj-ss-projects-608b0cb5.vercel.app';

  constructor(private http: HttpClient) {}

  uploadPdf(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${this.baseUrl}/upload-pdf`, formData);
  }

  askQuestion(question: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/ask-question`, { question });
  }

  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }
}