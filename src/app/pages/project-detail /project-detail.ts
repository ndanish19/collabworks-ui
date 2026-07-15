import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { ProjectService } from '../services/project.service';
import { TaskService } from '../services/task.service';
import { AuthService } from '../services/auth.service';

import { Project } from '../../models/project.model';
import { Task, TaskFormPayload, TASK_PRIORITIES, TASK_STATUSES } from '../../models/task.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetail implements OnInit {
  project: Project | null = null;
  tasks: Task[] = [];
  projectEmployees: any[] = [];

  statuses = TASK_STATUSES;
  priorities = TASK_PRIORITIES;

  loading = false;
  errorMessage = '';

  showTaskForm = false;
  editingTask: Task | null = null;
  formData: TaskFormPayload = this.emptyForm();

  role = '';
  projectId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  get canEditProject(): boolean {
    return this.role === 'MANAGER';
  }
  get canDeleteProject(): boolean {
    return this.role === 'MANAGER';
  }
  get canAddTask(): boolean {
    return this.role === 'MANAGER' || this.role === 'TEAM_LEAD';
  }
  get canEditTask(): boolean {
    return this.role === 'MANAGER' || this.role === 'TEAM_LEAD' || this.role === 'EMPLOYEE';
  }
  get canDeleteTask(): boolean {
    return this.role === 'MANAGER' || this.role === 'TEAM_LEAD';
  }

  ngOnInit(): void {
    this.role = this.authService.getCurrentUserValue()?.role || '';
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));

    this.loadProject();
    this.loadTasks();
    this.loadProjectEmployees();
  }

  loadProject(): void {
    this.loading = true;
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (p) => {
        this.project = this.mapProjectRoles(p);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load project.';
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

  loadTasks(): void {
    this.taskService.getAllTasks().subscribe({
      next: (all) => {
        this.tasks = all.filter((t) => t.project.id === this.projectId);
        this.cdr.detectChanges();
      },
    });
  }

  loadProjectEmployees(): void {
    this.projectService.getProjectEmployees(this.projectId).subscribe({
      next: (users) => (this.projectEmployees = users),
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/projects']);
  }

  deleteProject(): void {
    if (!this.project || !confirm(`Delete "${this.project.projectName}" ?`)) return;

    this.projectService.deleteProject(this.project.id).subscribe({
      next: () => this.goBack(),
      error: (err) => alert(err.error?.message || 'Delete failed'),
    });
  }

  openCreateTask(): void {
    this.editingTask = null;
    this.formData = this.emptyForm();
    this.showTaskForm = true;
  }

  openEditTask(task: Task): void {
    this.editingTask = task;
    this.formData = {
      taskName: task.taskName,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      project: { id: task.project.id },
      assignedUser: { id: task.assignedUser.id },
    };
    this.showTaskForm = true;
  }

  closeTaskForm(): void {
    this.showTaskForm = false;
    this.editingTask = null;
  }

  saveTask(): void {
    if (!this.formData.taskName.trim()) {
      alert('Task name is required.');
      return;
    }
    if (this.formData.assignedUser.id === 0) {
      alert('Please select an employee.');
      return;
    }

    this.formData.project = { id: this.projectId };

    const obs = this.editingTask
      ? this.taskService.updateTask(this.editingTask.id, this.formData)
      : this.taskService.createTask(this.formData);

    obs.subscribe({
      next: () => {
        this.closeTaskForm();
        this.loadTasks();
      },
      error: (err) => alert(err.error?.message || 'Failed to save task.'),
    });
  }

  deleteTask(task: Task): void {
    if (!confirm(`Delete task "${task.taskName}"?`)) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => this.loadTasks(),
      error: (err) => alert(err.error?.message || 'Failed to delete task.'),
    });
  }

  private emptyForm(): TaskFormPayload {
    return {
      taskName: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: '',
      project: { id: this.projectId },
      assignedUser: { id: 0 },
    };
  }
}
