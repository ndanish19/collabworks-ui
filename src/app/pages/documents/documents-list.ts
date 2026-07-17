import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProjectService } from '../services/project.service';
import { DocumentService } from '../services/document.service';
import { CurrentUser } from '../../models/current-user.model';
import { forkJoin } from 'rxjs';

interface ProjectWithDocCount {
  id: number;
  projectName: string;
  docCount: number;
}

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents-list.html',
  styleUrl: './documents-list.css',
})
export class DocumentsList implements OnInit {
  currentUser: CurrentUser | null = null;
  projects: ProjectWithDocCount[] = [];
  loading = true;

  constructor(
    private authService: AuthService,
    private projectService: ProjectService,
    private documentService: DocumentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.load();
  }

  private load(): void {
    const start = () => {
      const req =
        this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER'
          ? this.projectService.getAllProjects()
          : this.projectService.getMyProjects();

      req.subscribe({
        next: (projects: any[]) => {
          if (projects.length === 0) {
            this.projects = [];
            this.loading = false;
            this.cdr.detectChanges();
            return;
          }
          forkJoin(projects.map((p) => this.documentService.getDocumentsByProject(p.id))).subscribe(
            {
              next: (results) => {
                this.projects = projects.map((p, i) => ({
                  id: p.id,
                  projectName: p.projectName,
                  docCount: results[i].length,
                }));
                this.loading = false;
                this.cdr.detectChanges();
              },
              error: () => {
                this.loading = false;
                this.cdr.detectChanges();
              },
            },
          );
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
    };

    if (this.currentUser) start();
    else
      this.authService.fetchCurrentUser().subscribe({
        next: (user) => {
          this.currentUser = user;
          start();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  openProject(projectId: number): void {
    this.router.navigate(['/dashboard/documents', projectId]);
  }
}
