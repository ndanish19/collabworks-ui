import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';

  // Same regex as backend
  private readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  private readonly passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

  emailError = '';
  passwordError = '';

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  login(): void {
    this.emailError = '';
    this.passwordError = '';

    // Email Validation
    if (!this.email.trim()) {
      this.emailError = 'Email is required.';
      return;
    }

    if (!this.emailPattern.test(this.email)) {
      this.emailError = 'Enter a valid email address.';
      return;
    }

    // Password Validation
    if (!this.password.trim()) {
      this.passwordError = 'Password is required.';
      return;
    }

    if (!this.passwordPattern.test(this.password)) {
      this.passwordError =
        'Password must be at least 6 characters and contain at least one letter and one number.';
      return;
    }

    // API Call
    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        console.log(response);

        if (response.success) {
          this.authService.setToken(response.data);

          this.authService.fetchCurrentUser().subscribe({
            next: () => {
              this.router.navigate(['/dashboard']);
            },
            error: () => {
              alert('Logged in, but failed to load current user.');
            },
          });
        } else {
          alert(response.message);
        }
      },

      error: (error) => {
        console.error(error);

        if (error.error && error.error.message) {
          alert(error.error.message);
        } else {
          alert('Something went wrong');
        }
      },
    });
  }
}
