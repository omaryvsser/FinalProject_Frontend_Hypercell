import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Form Field Signals
  readonly email = signal<string>('');
  readonly password = signal<string>('');

  // Field Touch & Form Submission Signals
  readonly emailTouched = signal<boolean>(false);
  readonly passwordTouched = signal<boolean>(false);
  readonly isSubmitted = signal<boolean>(false);

  // UI State Signals
  readonly hidePassword = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly loginMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Computed Validation Signals
  readonly emailEmpty = computed(() => this.email().trim().length === 0);
  readonly emailInvalid = computed(() => {
    if (this.emailEmpty()) return false;
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim());
  });
  readonly passwordEmpty = computed(() => this.password().length === 0);

  // Form Validity Signal
  readonly isFormValid = computed(
    () => !this.emailEmpty() && !this.emailInvalid() && !this.passwordEmpty()
  );

  togglePasswordVisibility(): void {
    this.hidePassword.update((visible) => !visible);
  }

  onSubmit(): void {
    this.isSubmitted.set(true);

    if (!this.isFormValid()) {
      return;
    }

    this.isSubmitting.set(true);
    this.loginMessage.set(null);
    this.errorMessage.set(null);

    const payload = {
      email: this.email().trim(),
      password: this.password(),
    };

    this.authService.login(payload).subscribe({
      next: (res) => {
        this.authService.storeToken(res.token);
        this.isSubmitting.set(false);
        this.router.navigate(['/discover']);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Login failed. Please check your credentials and try again.'
        );
      },
    });
  }
}
