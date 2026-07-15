import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileItem } from '../../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private baseUrl = 'http://localhost:8080/api/files';

  constructor(private http: HttpClient) {}

  getFilesByProject(projectId: number): Observable<FileItem[]> {
    return this.http.get<FileItem[]>(`${this.baseUrl}/project/${projectId}`);
  }

  uploadFile(file: File, projectId: number): Observable<FileItem> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId.toString());
    return this.http.post<FileItem>(`${this.baseUrl}/upload`, formData);
  }

  downloadFile(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${id}`, { responseType: 'blob' });
  }

  updateFile(id: number, partial: Partial<FileItem>): Observable<FileItem> {
    return this.http.put<FileItem>(`${this.baseUrl}/${id}`, partial);
  }

  deleteFile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
