import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message, ConversationUser } from '../../models/message.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private apiUrl = 'http://localhost:8080/api/messages';

  constructor(private http: HttpClient) {}

  getPrivateConversations(): Observable<ConversationUser[]> {
    return this.http.get<ConversationUser[]>(`${this.apiUrl}/private-conversations`);
  }

  getPrivateConversation(senderId: number, receiverId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/private/${senderId}/${receiverId}`);
  }

  sendPrivateMessage(payload: any): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/private`, payload);
  }

  getProjectMessages(projectId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/project/${projectId}`);
  }

  sendProjectMessage(payload: any): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/project`, payload);
  }
  getChatDirectory(): Observable<{ id: number; name: string; role: string }[]> {
    return this.http.get<{ id: number; name: string; role: string }[]>(
      `${this.apiUrl.replace('/messages', '/users')}/chat-directory`,
    );
  }
}
