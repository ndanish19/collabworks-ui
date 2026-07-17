
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
  selector: 'app-project-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-chat.html',
  styleUrl: './private-chat.css', // reuse; adjust path to wherever you keep private-chat.css
})
export class ProjectChat implements OnInit, OnDestroy {
  currentUser: CurrentUser | null = null;
  projectId!: number;
  projectName = '';
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
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    this.projectName = this.route.snapshot.queryParamMap.get('name') || '';

    this.loadHistory();

    this.wsService.connect(() => {
      this.wsService.subscribeToProject(this.projectId);
    });

    this.wsSub = this.wsService.messages$.subscribe((msg) => {
      if (msg.messageType === 'PROJECT' && msg.projectId === this.projectId) {
        this.messages.push(msg);
        this.cdr.detectChanges();
      }
    });
  }

  loadHistory(): void {
    this.messageService.getProjectMessages(this.projectId).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        if (!this.projectName && msgs.length > 0) this.projectName = msgs[0].projectName || '';
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load project messages', err),
    });
  }

  send(): void {
    if (!this.newMessage.trim() || !this.currentUser) return;

    this.wsService.sendProjectMessage({
      content: this.newMessage,
      senderId: this.currentUser.id,
      projectId: this.projectId,
      messageType: 'PROJECT',
    });

    this.newMessage = '';
  }

  goBack(): void {
    this.wsService.unsubscribeFromProject(this.projectId);
    this.router.navigate(['/dashboard/chat']);
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsService.unsubscribeFromProject(this.projectId);
  }
}
