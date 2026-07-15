import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProjectService } from '../services/project.service';
import { FileService } from '../services/file.service';
import { CurrentUser } from '../../models/current-user.model';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

interface ProjectWithFileCount {
  id: number;
  projectName: string;
  fileCount: number;
}

@Component({
  selector: 'app-files-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './files-list.html',
  styleUrl: './files-list.css',
})
export class FilesList implements OnInit {
  currentUser: CurrentUser | null = null;

  projectsWithFiles: ProjectWithFileCount[] = [];
  projectsWithoutFiles: ProjectWithFileCount[] = [];
  loading = true;

  showUploadDialog = false;
  selectedProjectId: number | null = null;
  selectedFile: File | null = null;
  uploading = false;

  constructor(
    private authService: AuthService,
    private projectService: ProjectService,
    private fileService: FileService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.loadProjectsAndFiles();
  }

  get canUpload(): boolean {
    const role = this.currentUser?.role;
    return role === 'MANAGER' || role === 'TEAM_LEAD' || role === 'EMPLOYEE';
  }

  loadProjectsAndFiles(): void {
    this.loading = true;

    const start = () => {
      const projectsRequest =
        this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER'
          ? this.projectService.getAllProjects()
          : this.projectService.getMyProjects();

      projectsRequest.subscribe({
        next: (projects: any[]) => {
          if (projects.length === 0) {
            this.projectsWithFiles = [];
            this.projectsWithoutFiles = [];
            this.loading = false;
            this.cdr.detectChanges();
            return;
          }

          forkJoin(projects.map((p) => this.fileService.getFilesByProject(p.id))).subscribe({
            next: (results) => {
              this.projectsWithFiles = [];
              this.projectsWithoutFiles = [];
              projects.forEach((p, i) => {
                const entry = {
                  id: p.id,
                  projectName: p.projectName,
                  fileCount: results[i].length,
                };
                (results[i].length > 0 ? this.projectsWithFiles : this.projectsWithoutFiles).push(
                  entry,
                );
              });
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.loading = false;
              this.cdr.detectChanges();
            },
          });
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
    };

    if (this.currentUser) {
      start();
    } else {
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
  }

  openProject(projectId: number): void {
    this.router.navigate(['/dashboard/files', projectId]);
  }

  openUploadDialog(): void {
    this.selectedProjectId = null;
    this.selectedFile = null;
    this.showUploadDialog = true;
  }

  closeUploadDialog(): void {
    this.showUploadDialog = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  submitUpload(): void {
    if (!this.selectedProjectId || !this.selectedFile) return;
    this.uploading = true;
    this.fileService.uploadFile(this.selectedFile, this.selectedProjectId).subscribe({
      next: () => {
        this.uploading = false;
        this.showUploadDialog = false;
        this.loadProjectsAndFiles();
      },
      error: () => {
        this.uploading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
