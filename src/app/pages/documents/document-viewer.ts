import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { DocumentService } from '../services/document.service';
import { WebsocketService } from '../services/websocket.service';
import { DocumentItem } from '../../models/document.model';
import { CurrentUser } from '../../models/current-user.model';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-viewer.html',
  styleUrl: './document-viewer.css',
})
export class DocumentViewer implements OnInit, OnDestroy {
  currentUser: CurrentUser | null = null;
  documentId!: number;
  doc: DocumentItem | null = null;
  loading = true;

  editMode = false;
  editTitle = '';
  editContent = '';
  saving = false;
  conflict = false;

  private wsSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private documentService: DocumentService,
    private websocketService: WebsocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.documentId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();

    this.websocketService.connect(() => this.websocketService.subscribeToDocument(this.documentId));

    this.wsSub = this.websocketService.documents$.subscribe((updated) => {
      if (updated.id !== this.documentId) return;
      if (!this.editMode) {
        this.doc = updated;
        this.cdr.detectChanges();
      } else {
        this.doc = updated;
      } // keep server version fresh; don't touch local edit buffer
    });
  }

  ngOnDestroy(): void {
    this.websocketService.unsubscribeFromDocument(this.documentId);
    this.wsSub?.unsubscribe();
  }

  get canEdit(): boolean {
    const role = this.currentUser?.role;
    return role === 'MANAGER' || role === 'TEAM_LEAD' || role === 'EMPLOYEE';
  }

  get canDelete(): boolean {
    const role = this.currentUser?.role;
    return role === 'MANAGER' || role === 'TEAM_LEAD';
  }

  load(): void {
    this.loading = true;
    this.documentService.getDocumentById(this.documentId).subscribe({
      next: (doc) => {
        this.doc = doc;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  enterEditMode(): void {
    if (!this.doc) return;
    this.editTitle = this.doc.title;
    this.editContent = this.doc.content;
    this.editMode = true;
  }

  cancelEdit(): void {
    this.editMode = false;
    this.conflict = false;
  }

  save(): void {
    if (!this.doc) return;
    this.saving = true;
    this.documentService
      .updateDocument(this.doc.id, this.editTitle, this.editContent, this.doc.version)
      .subscribe({
        next: (updated) => {
          this.doc = updated;
          this.saving = false;
          this.editMode = false;
          this.conflict = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;
          if (err.status === 409) this.conflict = true;
          this.cdr.detectChanges();
        },
      });
  }

  refresh(): void {
    this.conflict = false;
    this.load();
  }

  deleteDocument(): void {
    if (!this.doc || !confirm('Delete this document?')) return;
    this.documentService.deleteDocument(this.doc.id).subscribe({
      next: () => this.router.navigate(['/dashboard/documents']),
    });
  }

  download(): void {
    if (!this.doc) return;
    this.documentService.downloadDocument(this.doc.id).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${this.doc!.title}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/documents', this.doc?.projectId]);
  }
}
