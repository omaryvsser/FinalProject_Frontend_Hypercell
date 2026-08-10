import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
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
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // 1. Form Field Signals
  readonly name = signal<string>('');
  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly confirmPassword = signal<string>('');

  // 2. Field Touch & Form Submission Signals
  readonly nameTouched = signal<boolean>(false);
  readonly emailTouched = signal<boolean>(false);
  readonly passwordTouched = signal<boolean>(false);
  readonly confirmPasswordTouched = signal<boolean>(false);
  readonly isSubmitted = signal<boolean>(false);

  // 3. UI Control & Alert Signals
  readonly hidePassword = signal<boolean>(true);
  readonly hideConfirmPassword = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly registerMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // 4. Computed Signal Validation Rules
  readonly nameError = computed<string | null>(() => {
    const val = this.name().trim();
    if (!val) {
      return 'Full name is required';
    }
    return null;
  });

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
    if (val.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return null;
  });

  readonly confirmPasswordError = computed<string | null>(() => {
    const val = this.confirmPassword();
    if (!val) {
      return 'Please re-enter your password';
    }
    if (val !== this.password()) {
      return 'Passwords do not match';
    }
    return null;
  });

  // 5. Angular Material ErrorStateMatchers for Signals
  readonly nameMatcher: ErrorStateMatcher = {
    isErrorState: () => (this.isSubmitted() || this.nameTouched()) && this.nameError() !== null,
  };

  readonly emailMatcher: ErrorStateMatcher = {
    isErrorState: () => (this.isSubmitted() || this.emailTouched()) && this.emailError() !== null,
  };

  readonly passwordMatcher: ErrorStateMatcher = {
    isErrorState: () => (this.isSubmitted() || this.passwordTouched()) && this.passwordError() !== null,
  };

  readonly confirmPasswordMatcher: ErrorStateMatcher = {
    isErrorState: () => (this.isSubmitted() || this.confirmPasswordTouched()) && this.confirmPasswordError() !== null,
  };

  // 6. Computed Overall Form Validity Signal
  readonly isFormValid = computed<boolean>(
    () =>
      this.nameError() === null &&
      this.emailError() === null &&
      this.passwordError() === null &&
      this.confirmPasswordError() === null
  );

  togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((val) => !val);
  }

  // 7. Signal-Based Form Submission Handler
  onSubmit(): void {
    this.isSubmitted.set(true);

    if (!this.isFormValid()) {
      return;
    }

    this.isSubmitting.set(true);
    this.registerMessage.set(null);
    this.errorMessage.set(null);

    const payload = {
      name: this.name().trim(),
      email: this.email().trim(),
      password: this.password(),
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Registration error:', err);
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Registration failed. Please try again.'
        );
      },
    });
  }
}
