import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { Subject } from 'rxjs';
import { Message } from '../../models/message.model';
import { DocumentItem } from '../../models/document.model';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private client: Client | null = null;
  private connected = false;

  private projectSubs = new Map<number, StompSubscription>();

  public messages$ = new Subject<Message>();
  public errors$ = new Subject<string>();

  connect(onConnected?: () => void): void {
    console.log('WebSocket connect() called');

    if (this.client && this.connected) {
      onConnected?.();
      return;
    }

    const token = localStorage.getItem('token');

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws') as any,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('WebSocket Connected');
        this.connected = true;

        this.client!.subscribe('/user/queue/messages', (msg: IMessage) => {
          this.messages$.next(JSON.parse(msg.body));
        });

        this.client!.subscribe('/user/queue/errors', (msg: IMessage) => {
          this.errors$.next(msg.body);
        });

        onConnected?.();
      },
    });

    this.client.activate();
  }

  subscribeToProject(projectId: number): void {
    if (!this.client || this.projectSubs.has(projectId)) return;

    const sub = this.client.subscribe(`/topic/project/${projectId}`, (msg: IMessage) => {
      this.messages$.next(JSON.parse(msg.body));
    });

    this.projectSubs.set(projectId, sub);
  }

  unsubscribeFromProject(projectId: number): void {
    this.projectSubs.get(projectId)?.unsubscribe();
    this.projectSubs.delete(projectId);
  }

  sendPrivateMessage(payload: any): void {
    this.client?.publish({ destination: '/app/private-message', body: JSON.stringify(payload) });
  }

  sendProjectMessage(payload: any): void {
    this.client?.publish({ destination: '/app/project-message', body: JSON.stringify(payload) });
  }

  disconnect(): void {
    this.client?.deactivate();
    this.connected = false;
    this.projectSubs.clear();
    this.documentSubs.clear();
  }

  private documentSubs = new Map<number, StompSubscription>();
  public documents$ = new Subject<DocumentItem>();

  subscribeToDocument(documentId: number): void {
    if (!this.client || this.documentSubs.has(documentId)) return;
    const sub = this.client.subscribe(`/topic/document/${documentId}`, (msg: IMessage) => {
      this.documents$.next(JSON.parse(msg.body));
    });
    this.documentSubs.set(documentId, sub);
  }

  unsubscribeFromDocument(documentId: number): void {
    this.documentSubs.get(documentId)?.unsubscribe();
    this.documentSubs.delete(documentId);
  }


}
