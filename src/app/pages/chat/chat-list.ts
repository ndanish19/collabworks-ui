
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProjectService } from '../services/project.service'; // adjust path if different
import { MessageService } from '../services/message.service';
import { ConversationUser } from '../../models/message.model';
import { CurrentUser } from '../../models/current-user.model';
import { User } from '../../models/user.model';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.css',
})
export class ChatList implements OnInit {
  currentUser: CurrentUser | null = null;
  privateConversations: ConversationUser[] = [];
  projects: any[] = []; // expects { id, projectName }

  showModal = false;
  messageType: 'PRIVATE' | 'PROJECT' = 'PROJECT';
  allUsers: User[] = [];
  selectedUserId: number | null = null;
  selectedProjectId: number | null = null;

  constructor(
    private authService: AuthService,
    private projectService: ProjectService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.loadConversations();
    this.loadProjects();
  }

  get canSendPrivate(): boolean {
    return this.currentUser?.role !== 'CLIENT';
  }
  loadConversations(): void {
    this.messageService.getPrivateConversations().subscribe({
      next: (users) => {
        this.privateConversations = users;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load conversations', err),
    });
  }

  loadProjects(): void {
    const isAdminOrManager =
      this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER';

    const source = isAdminOrManager
      ? this.projectService.getAllProjects()
      : this.projectService.getMyProjects();

    source.subscribe({
      next: (projects: any[]) => {
        this.projects = projects;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Failed to load projects', err),
    });
  }

  openModal(): void {
    this.messageType = this.canSendPrivate ? 'PRIVATE' : 'PROJECT';
    this.selectedUserId = null;
    this.selectedProjectId = null;
    this.loadUsersIfNeeded();
    this.showModal = true;
  }

  onMessageTypeChange(): void {
    this.loadUsersIfNeeded();
  }

  private loadUsersIfNeeded(): void {
    if (this.messageType === 'PRIVATE' && this.allUsers.length === 0) {
      this.messageService.getChatDirectory().subscribe({
        next: (users) => {
          this.allUsers = users.filter((u) => u.id !== this.currentUser?.id) as any;
          this.cdr.detectChanges(); // ← missing line
        },
        error: (err) => console.error('Failed to load users', err),
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
  }

  createConversation(): void {
    if (this.messageType === 'PRIVATE' && this.selectedUserId) {
      const user = this.allUsers.find((u) => u.id === this.selectedUserId);
      this.showModal = false;
      this.router.navigate(['/dashboard/chat/private', this.selectedUserId], {
        queryParams: { name: user?.name || '' },
      });
    } else if (this.messageType === 'PROJECT' && this.selectedProjectId) {
      const project = this.projects.find((p) => p.id === this.selectedProjectId);
      this.showModal = false;
      this.router.navigate(['/dashboard/chat/project', this.selectedProjectId], {
        queryParams: { name: project?.projectName || '' },
      });
    }
  }

  openPrivateChat(userId: number, name: string): void {
    this.router.navigate(['/dashboard/chat/private', userId], { queryParams: { name } });
  }

  openProjectChat(projectId: number, name: string): void {
    this.router.navigate(['/dashboard/chat/project', projectId], { queryParams: { name } });
  }
}
