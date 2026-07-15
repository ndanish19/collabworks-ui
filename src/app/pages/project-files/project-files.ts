import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ProjectService } from '../services/project.service';
import { FileService } from '../services/file.service';
import { FileItem } from '../../models/file.model';
import { CurrentUser } from '../../models/current-user.model';

@Component({
  selector: 'app-project-files',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-files.html',
  styleUrl: './project-files.css',
})
export class ProjectFiles implements OnInit {
  currentUser: CurrentUser | null = null;
  projectId!: number;
  project: any = null;
  files: FileItem[] = [];
  loading = true;

  showUploadDialog = false;
  selectedFile: File | null = null;
  uploading = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private projectService: ProjectService,
    private fileService: FileService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    this.loadProject();
    this.loadFiles();
  }

  get role(): string | undefined {
    return this.currentUser?.role;
  }

  get canUpload(): boolean {
    return this.role === 'MANAGER' || this.role === 'TEAM_LEAD' || this.role === 'EMPLOYEE';
  }

  get canDelete(): boolean {
    return this.role === 'MANAGER' || this.role === 'TEAM_LEAD';
  }

  loadProject(): void {
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (p) => {
        this.project = p;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('Project Error:', err);
      },
    });
  }

  loadFiles(): void {
    this.loading = true;

    this.fileService.getFilesByProject(this.projectId).subscribe({
      next: (files) => {
        this.files = files;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log(err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  uploadMore(): void {
    if (!this.selectedFile) {
      return;
    }

    this.uploading = true;

    this.fileService.uploadFile(this.selectedFile, this.projectId).subscribe({
      next: () => {
        this.uploading = false;
        this.showUploadDialog = false;
        this.selectedFile = null;
        this.loadFiles();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.uploading = false;
        this.cdr.detectChanges();
        alert(err.error?.message || 'Failed to upload file.');
      },
    });
  }

  download(file: FileItem): void {
    this.fileService.downloadFile(file.id).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  deleteFile(file: FileItem): void {
    if (!confirm(`Delete ${file.fileName}?`)) return;
    this.fileService.deleteFile(file.id).subscribe({
      next: () => {
        this.loadFiles();
      },
    });
  }

  viewFile(file: FileItem): void {
    this.fileService.downloadFile(file.id).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }
}
