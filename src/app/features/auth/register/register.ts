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
  selector: 'app-register',
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

  // Form Field Signals
  readonly name = signal<string>('');
  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly confirmPassword = signal<string>('');

  // Field Touch & Form Submission Signals
  readonly nameTouched = signal<boolean>(false);
  readonly emailTouched = signal<boolean>(false);
  readonly passwordTouched = signal<boolean>(false);
  readonly confirmPasswordTouched = signal<boolean>(false);
  readonly isSubmitted = signal<boolean>(false);

  // UI State Signals
  readonly hidePassword = signal<boolean>(true);
  readonly hideConfirmPassword = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly registerMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Computed Validation Signals
  readonly nameEmpty = computed(() => this.name().trim().length === 0);

  readonly emailEmpty = computed(() => this.email().trim().length === 0);
  readonly emailInvalid = computed(() => {
    if (this.emailEmpty()) return false;
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim());
  });

  readonly passwordEmpty = computed(() => this.password().length === 0);
  readonly passwordTooShort = computed(() => {
    if (this.passwordEmpty()) return false;
    return this.password().length < 8;
  });

  readonly confirmPasswordEmpty = computed(() => this.confirmPassword().length === 0);
  readonly passwordMismatch = computed(() => {
    if (this.confirmPasswordEmpty()) return false;
    return this.password() !== this.confirmPassword();
  });

  // Form Validity Signal
  readonly isFormValid = computed(
    () =>
      !this.nameEmpty() &&
      !this.emailEmpty() &&
      !this.emailInvalid() &&
      !this.passwordEmpty() &&
      !this.passwordTooShort() &&
      !this.confirmPasswordEmpty() &&
      !this.passwordMismatch()
  );

  togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((val) => !val);
  }

  onSubmit(): void {
    this.isSubmitted.set(true);

    if (!this.isFormValid()) {
      return;
    }

    this.isSubmitting.set(true);
    this.registerMessage.set(null);
    this.errorMessage.set(null);

    // Java RegisterRequest uses 'name' (not 'fullName') — aligned here
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
