import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ChatMessage {
  content: string;
  isUser: boolean;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('chatMessages') chatMessages!: ElementRef<HTMLDivElement>;
  
  @Input() messages: ChatMessage[] = [];
  @Input() isProcessing: boolean = false;
  @Output() questionAsked = new EventEmitter<string>();
  
  currentQuestion = '';

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  askExampleQuestion(question: string): void {
    this.questionAsked.emit(question);
  }

  sendMessage(): void {
    if (!this.currentQuestion.trim() || this.isProcessing) return;
    
    const question = this.currentQuestion;
    this.currentQuestion = '';
    this.questionAsked.emit(question);
  }

  private scrollToBottom(): void {
    if (this.chatMessages) {
      this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
    }
  }
}