import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CurrentUser } from '../../models/current-user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  currentUser: CurrentUser | null = null;
  pageTitle = '🏠 Home';

  showProfileMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();

    if (!this.currentUser) {
      this.authService.fetchCurrentUser().subscribe({
        next: (user) => (this.currentUser = user),
        error: (err) => console.error('fetchCurrentUser failed on refresh:', err),
      });
    }
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url.includes('/users')) {
          this.pageTitle = '👥 User Management';
        } else if (event.url.includes('/projects')) {
          this.pageTitle = '📁 Projects';
        } else if (event.url.includes('/tasks')) {
          this.pageTitle = '✅ Tasks';
        } else if (event.url.includes('/documents')) {
          this.pageTitle = '📄 Documents';
        } else if (event.url.includes('/files')) {
          this.pageTitle = '📂 Files';
        } else if (event.url.includes('/chat')) {
          this.pageTitle = '💬 Chat';
        } else {
          this.pageTitle = '🏠 Home';
        }
      }
    });
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    this.authService.logout();
  }
}
