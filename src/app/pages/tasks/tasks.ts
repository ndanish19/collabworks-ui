import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { TaskService } from '../services/task.service';
import { AuthService } from '../services/auth.service';
import { ProjectService } from '../services/project.service';
import { UserService } from '../services/user.service';

import { Project } from '../../models/project.model';
import { User } from '../../models/user.model';

import {
  Task,
  TaskFormPayload,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskPriority,
  TaskStatus,
} from '../../models/task.model';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks implements OnInit {
  tasks: Task[] = [];
  projects: Project[] = [];
  users: User[] = [];

  statuses: TaskStatus[] = TASK_STATUSES;
  priorities: TaskPriority[] = TASK_PRIORITIES;

  loading = false;
  errorMessage = '';

  showForm = false;

  editingTask: Task | null = null;
  viewingTask: Task | null = null;

  canCreateDelete = false;
  canEdit = false;

  formData: TaskFormPayload = this.emptyForm();

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUserValue();

    this.canCreateDelete = currentUser?.role === 'MANAGER' || currentUser?.role === 'TEAM_LEAD';

    this.canEdit =
      currentUser?.role === 'MANAGER' ||
      currentUser?.role === 'TEAM_LEAD' ||
      currentUser?.role === 'EMPLOYEE';

    this.loadTasks();
    this.loadProjects();
    this.loadUsers();
  }

  loadTasks(): void {
    this.loading = true;
    this.errorMessage = '';

    this.taskService.getAllTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load tasks.';

        this.loading = false;

        this.cdr.detectChanges();
      },
    });
  }
  loadProjects(): void {
    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },

      error: (err) => {
        console.error('Failed to load projects', err);
      },
    });
  }

  loadUsers(): void {
    this.userService.getEmployees().subscribe({
      next: (users) => {
        this.users = users;
      },

      error: (err) => {
        console.error('Failed to load employees', err);
      },
    });
  }

  openCreateForm(): void {
    this.editingTask = null;

    this.formData = this.emptyForm();

    this.showForm = true;
  }

  openEditForm(task: Task): void {
    this.editingTask = task;

    this.formData = {
      taskName: task.taskName,

      description: task.description,

      status: task.status,

      priority: task.priority,

      dueDate: task.dueDate,

      project: {
        id: task.project.id,
      },

      assignedUser: {
        id: task.assignedUser.id,
      },
    };

    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;

    this.editingTask = null;
  }

  openViewTask(task: Task): void {
    this.viewingTask = task;
  }

  closeView(): void {
    this.viewingTask = null;
  }
  saveTask(): void {
    if (!this.formData.taskName.trim()) {
      alert('Task name is required.');
      return;
    }
    if (!this.formData.dueDate) {
      alert('Please select a due date.');
      return;
    }
    if (this.formData.project.id === 0) {
      alert('Please select a project.');
      return;
    }

    if (this.formData.assignedUser.id === 0) {
      alert('Please select an employee.');
      return;
    }

    if (this.editingTask) {
      this.taskService.updateTask(this.editingTask.id, this.formData).subscribe({
        next: () => {
          this.closeForm();

          this.loadTasks();
        },

        error: (err) => alert(err.error?.message || 'Failed to update task.'),
      });
    } else {
      this.taskService.createTask(this.formData).subscribe({
        next: () => {
          this.closeForm();

          this.loadTasks();
        },

        error: (err) => alert(err.error?.message || 'Failed to create task.'),
      });
    }
  }

  deleteTask(task: Task): void {
    if (!confirm(`Delete task "${task.taskName}"? This cannot be undone.`)) {
      return;
    }

    this.taskService.deleteTask(task.id).subscribe({
      next: () => this.loadTasks(),

      error: (err) => {
        const rawMessage = err.error?.message || '';

        if (
          rawMessage.toLowerCase().includes('foreign key') ||
          rawMessage.toLowerCase().includes('constraint')
        ) {
          alert(
            `Cannot delete "${task.taskName}" because it is still referenced by another record.`,
          );
        } else {
          alert(rawMessage || 'Failed to delete task.');
        }
      },
    });
  }

  private emptyForm(): TaskFormPayload {
    return {
      taskName: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: '',
      project: {
        id: 0,
      },
      assignedUser: {
        id: 0,
      },
    };
  }
}
