import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DocumentService } from '../services/document.service';
import { DocumentItem } from '../../models/document.model';
import { CurrentUser } from '../../models/current-user.model';
import { ProjectService } from '../services/project.service';

@Component({
  selector: 'app-project-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-documents.html',
  styleUrl: './project-documents.css',
})
export class ProjectDocuments implements OnInit {
  currentUser: CurrentUser | null = null;
  projectId!: number;
  documents: DocumentItem[] = [];
  loading = true;

  showCreateDialog = false;
  newTitle = '';
  newContent = '';
  creating = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private documentService: DocumentService,
    private projectService: ProjectService, // ← add
    private cdr: ChangeDetectorRef,
  ) {}

  projectName = '';

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    this.load();
  }

  get canCreate(): boolean {
    const role = this.currentUser?.role;
    return role === 'MANAGER' || role === 'TEAM_LEAD';
  }

  load(): void {
    this.loading = true;

    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        this.projectName = project.projectName;
        this.cdr.detectChanges();
      },
    });

    this.documentService.getDocumentsByProject(this.projectId).subscribe({
      next: (docs) => {
        this.documents = docs;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openDocument(id: number): void {
    this.router.navigate(['/dashboard/document', id]);
  }

  openCreateDialog(): void {
    this.newTitle = '';
    this.newContent = '';
    this.showCreateDialog = true;
  }
  closeCreateDialog(): void {
    this.showCreateDialog = false;
  }

  submitCreate(): void {
    if (!this.newTitle.trim()) return;
    this.creating = true;
    this.documentService.createDocument(this.newTitle, this.newContent, this.projectId).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateDialog = false;
        this.load();
      },
      error: () => {
        this.creating = false;
        this.cdr.detectChanges();
      },
    });
  }
  goBack(): void {
    this.router.navigate(['/dashboard/documents']);
  }
}
