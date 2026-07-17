import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { CurrentUser } from '../../models/current-user.model';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css',
})
export class MyProfile implements OnInit {
  currentUser: CurrentUser | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    if (!this.currentUser) {
      this.authService.fetchCurrentUser().subscribe({
        next: (user) => (this.currentUser = user),
      });
    }
  }
}
