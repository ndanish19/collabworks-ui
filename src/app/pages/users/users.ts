import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService } from '../services/user.service';
import { User, UserFormPayload, ROLES, Role } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  users: User[] = [];
  roles: Role[] = ROLES;

  loading = false;
  errorMessage = '';

  showForm = false;
  editingUser: User | null = null;
  viewingUser: User | null = null;

  formData: UserFormPayload = this.emptyForm();

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load users.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openCreateForm(): void {
    this.editingUser = null;
    this.formData = this.emptyForm();
    this.showForm = true;
  }

  openEditForm(user: User): void {
    this.editingUser = user;
    this.formData = {
      name: user.name,
      email: user.email,
      password: '',
      role: { id: user.role.id },
    };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingUser = null;
  }

  openViewUser(user: User): void {
    this.viewingUser = user;
  }

  closeView(): void {
    this.viewingUser = null;
  }

  saveUser(): void {
    if (!this.formData.name.trim() || !this.formData.email.trim()) {
      alert('Name and email are required.');
      return;
    }

    if (!this.editingUser && !this.formData.password.trim()) {
      alert('Password is required when creating a new user.');
      return;
    }

    if (this.editingUser) {
      this.userService.updateUser(this.editingUser.id, this.formData).subscribe({
        next: () => {
          this.closeForm();
          this.loadUsers();
        },
        error: (err) => alert(err.error?.message || 'Failed to update user.'),
      });
    } else {
      this.userService.createUser(this.formData).subscribe({
        next: () => {
          this.closeForm();
          this.loadUsers();
        },
        error: (err) => alert(err.error?.message || 'Failed to create user.'),
      });
    }
  }

  deleteUser(user: User): void {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => {
        const rawMessage = err.error?.message || '';

        if (
          rawMessage.toLowerCase().includes('foreign key') ||
          rawMessage.toLowerCase().includes('constraint')
        ) {
          alert(
            `Cannot delete "${user.name}" — this user is still assigned to one or more projects. Remove them from those projects first.`,
          );
        } else {
          alert(rawMessage || 'Failed to delete user.');
        }
      },
    });
  }

  private emptyForm(): UserFormPayload {
    return {
      name: '',
      email: '',
      password: '',
      role: { id: 1 },
    };
  }
}
