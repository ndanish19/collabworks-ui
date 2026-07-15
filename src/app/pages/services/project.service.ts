import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, ProjectFormPayload } from '../../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = 'http://localhost:8080/api/projects';

  constructor(private http: HttpClient) {}

  getAllProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  createProject(payload: ProjectFormPayload): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, payload);
  }

  updateProject(id: number, payload: ProjectFormPayload): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, payload);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getProjectMembers(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/members`);
  }

  getProjectEmployees(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/employees`);
  }
  getMyProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/my-projects`);
  }
}
