import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentItem } from '../../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private baseUrl = 'http://localhost:8080/api/documents';

  constructor(private http: HttpClient) {}

  getDocumentsByProject(projectId: number): Observable<DocumentItem[]> {
    return this.http.get<DocumentItem[]>(`${this.baseUrl}/project/${projectId}`);
  }

  getDocumentById(id: number): Observable<DocumentItem> {
    return this.http.get<DocumentItem>(`${this.baseUrl}/${id}`);
  }

  createDocument(title: string, content: string, projectId: number): Observable<DocumentItem> {
    return this.http.post<DocumentItem>(this.baseUrl, { title, content, projectId });
  }

  updateDocument(
    id: number,
    title: string,
    content: string,
    version: number,
  ): Observable<DocumentItem> {
    return this.http.put<DocumentItem>(`${this.baseUrl}/${id}`, { title, content, version });
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${id}`, { responseType: 'blob' });
  }
}
