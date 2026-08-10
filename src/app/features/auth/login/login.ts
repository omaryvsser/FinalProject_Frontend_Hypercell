import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
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
  private readonly route = inject(ActivatedRoute);

  // 1. Form State Signals
  readonly email = signal<string>('');
  readonly password = signal<string>('');

  // 2. Field Touch & Form Submission Signals
  readonly emailTouched = signal<boolean>(false);
  readonly passwordTouched = signal<boolean>(false);
  readonly isSubmitted = signal<boolean>(false);

  // 3. UI Control & Alert Signals
  readonly hidePassword = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly loginMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // 4. Computed Signal Validation Rules
  readonly emailError = computed<string | null>(() => {
    const val = this.email().trim();
    if (!val) {
      return 'Email address is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      return 'Please enter a valid email address';
    }
    return null;
  });

  readonly passwordError = computed<string | null>(() => {
    const val = this.password();
    if (!val) {
      return 'Password is required';
    }
    return null;
  });

  // 5. Angular Material ErrorStateMatchers for Signals
  readonly emailMatcher: ErrorStateMatcher = {
    isErrorState: () => (this.isSubmitted() || this.emailTouched()) && this.emailError() !== null,
  };

  readonly passwordMatcher: ErrorStateMatcher = {
    isErrorState: () => (this.isSubmitted() || this.passwordTouched()) && this.passwordError() !== null,
  };

  // 6. Computed Overall Form Validity Signal
  readonly isFormValid = computed<boolean>(
    () => this.emailError() === null && this.passwordError() === null
  );

  togglePasswordVisibility(): void {
    this.hidePassword.update((visible) => !visible);
  }

  // 7. Signal-Based Form Submission Handler
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
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/discover';
        this.router.navigateByUrl(returnUrl);
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
