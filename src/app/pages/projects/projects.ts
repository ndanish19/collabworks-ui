import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { ProjectService } from '../services/project.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import {
  Project,
  ProjectFormPayload,
  ProjectUser,
  PROJECT_STATUSES,
} from '../../models/project.model';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects implements OnInit {
  projects: Project[] = [];

  statuses = PROJECT_STATUSES;

  loading = false;
  errorMessage = '';

  showForm = false;
  editingProject: Project | null = null;
  viewingProject: Project | null = null;

  canManage = false;

  teamLeads: ProjectUser[] = [];
  employees: ProjectUser[] = [];
  clients: ProjectUser[] = [];

  selectedTeamLeadId: number | null = null;
  selectedEmployeeIds: number[] = [];
  selectedClientIds: number[] = [];

  formData: ProjectFormPayload = this.emptyForm();

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router, // add
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUserValue();
    this.canManage = currentUser?.role === 'MANAGER';

    this.loadProjects();

    if (this.canManage) {
      this.loadAssignableUsers();
    }
  }

  loadProjects(): void {
    this.loading = true;
    this.errorMessage = '';

    const currentUser = this.authService.getCurrentUserValue();
    const isManagerOrAdmin = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';

    const request$ = isManagerOrAdmin
      ? this.projectService.getAllProjects()
      : this.projectService.getMyProjects();

    request$.subscribe({
      next: (projects) => {
        this.projects = projects.map((p) => this.mapProjectRoles(p));
        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load projects.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private mapProjectRoles(p: any): Project {
    return {
      ...p,
      teamLead: p.users.find((u: any) => u.role?.roleName === 'TEAM_LEAD'),
      employees: p.users.filter((u: any) => u.role?.roleName === 'EMPLOYEE'),
      clients: p.users.filter((u: any) => u.role?.roleName === 'CLIENT'),
    };
  }

  loadAssignableUsers(): void {
    this.userService.getUsersByRole('TEAM_LEAD').subscribe((users) => (this.teamLeads = users));

    this.userService.getUsersByRole('EMPLOYEE').subscribe((users) => (this.employees = users));

    this.userService.getUsersByRole('CLIENT').subscribe((users) => (this.clients = users));
  }

  openCreateForm(): void {
    this.editingProject = null;

    this.formData = this.emptyForm();

    this.selectedTeamLeadId = null;
    this.selectedEmployeeIds = [];
    this.selectedClientIds = [];

    this.showForm = true;
  }

  openEditForm(project: Project): void {
    this.editingProject = project;

    this.formData = {
      projectName: project.projectName,
      description: project.description,
      status: project.status,
      deadline: project.deadline,
      users: [],
    };

    this.selectedTeamLeadId = null;
    this.selectedEmployeeIds = [];
    this.selectedClientIds = [];

    project.users.forEach((user) => {
      const teamLead = this.teamLeads.find((x) => x.id === user.id);
      const employee = this.employees.find((x) => x.id === user.id);
      const client = this.clients.find((x) => x.id === user.id);

      if (teamLead) {
        this.selectedTeamLeadId = user.id;
      }

      if (employee) {
        this.selectedEmployeeIds.push(user.id);
      }

      if (client) {
        this.selectedClientIds.push(user.id);
      }
    });

    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingProject = null;
  }

  openViewProject(project: Project): void {
    this.router.navigate(['/dashboard/projects', project.id]);
  }
  closeView(): void {
    this.viewingProject = null;
  }

  saveProject(): void {
    if (!this.formData.projectName.trim()) {
      alert('Project Name is required');
      return;
    }

    const ids: number[] = [];

    if (this.selectedTeamLeadId) {
      ids.push(this.selectedTeamLeadId);
    }

    ids.push(...this.selectedEmployeeIds);
    ids.push(...this.selectedClientIds);

    this.formData.users = ids.map((id) => ({ id }));

    if (this.editingProject) {
      this.projectService.updateProject(this.editingProject.id, this.formData).subscribe({
        next: () => {
          this.closeForm();
          this.loadProjects();
        },

        error: (err) => alert(err.error?.message || 'Failed to update project'),
      });
    } else {
      this.projectService.createProject(this.formData).subscribe({
        next: () => {
          this.closeForm();
          this.loadProjects();
        },

        error: (err) => alert(err.error?.message || 'Failed to create project'),
      });
    }
  }

  deleteProject(project: Project): void {
    if (!confirm(`Delete "${project.projectName}" ?`)) {
      return;
    }

    this.projectService.deleteProject(project.id).subscribe({
      next: () => this.loadProjects(),

      error: (err) => {
        const msg = err.error?.message || '';

        if (msg.toLowerCase().includes('constraint') || msg.toLowerCase().includes('foreign key')) {
          alert('Project contains tasks/files/documents. Delete them first.');
        } else {
          alert(msg || 'Delete failed');
        }
      },
    });
  }

  toggleEmployee(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.selectedEmployeeIds.includes(id)) {
        this.selectedEmployeeIds.push(id);
      }
    } else {
      this.selectedEmployeeIds = this.selectedEmployeeIds.filter((empId) => empId !== id);
    }
  }
  toggleClient(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.selectedClientIds.includes(id)) {
        this.selectedClientIds.push(id);
      }
    } else {
      this.selectedClientIds = this.selectedClientIds.filter((clientId) => clientId !== id);
    }
  }
  private emptyForm(): ProjectFormPayload {
    return {
      projectName: '',
      description: '',
      status: 'PENDING',
      deadline: '',
      users: [],
    };
  }
}
