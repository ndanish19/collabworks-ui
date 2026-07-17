
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MessageService } from '../services/message.service';
import { WebsocketService } from '../services/websocket.service';
import { Message } from '../../models/message.model';
import { CurrentUser } from '../../models/current-user.model';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-private-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './private-chat.html',
  styleUrl: './private-chat.css',
})
export class PrivateChat implements OnInit, OnDestroy {
  currentUser: CurrentUser | null = null;
  receiverId!: number;
  receiverName = '';
  messages: Message[] = [];
  newMessage = '';

  private wsSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
    private wsService: WebsocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.receiverId = Number(this.route.snapshot.paramMap.get('userId'));
    this.receiverName = this.route.snapshot.queryParamMap.get('name') || '';

    this.loadHistory();
    this.wsService.connect();

    console.log('Chat component initialized');

    this.wsSub = this.wsService.messages$.subscribe((msg) => {
      const belongsHere =
        msg.messageType === 'PRIVATE' &&
        ((msg.senderId === this.currentUser?.id && msg.receiverId === this.receiverId) ||
          (msg.senderId === this.receiverId && msg.receiverId === this.currentUser?.id));

      if (belongsHere) {
        this.messages.push(msg);
        this.cdr.detectChanges();
      }
    });
  }

  loadHistory(): void {
    if (!this.currentUser) return;

    this.messageService.getPrivateConversation(this.currentUser.id, this.receiverId).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        if (!this.receiverName && msgs.length > 0) {
          const other = msgs.find((m) => m.senderId !== this.currentUser?.id);
          this.receiverName = other?.senderName || msgs[0].receiverName || '';
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load conversation', err),
    });
  }

  send(): void {
    if (!this.newMessage.trim() || !this.currentUser) return;

    this.wsService.sendPrivateMessage({
      content: this.newMessage,
      senderId: this.currentUser.id,
      receiverId: this.receiverId,
      messageType: 'PRIVATE',
    });

    this.newMessage = '';
  }

  goBack(): void {
    this.router.navigate(['/dashboard/chat']);
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }
}
