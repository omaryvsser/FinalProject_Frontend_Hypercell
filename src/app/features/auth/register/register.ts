import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

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
  private readonly router = inject(Router);

  // Form Field Signals
  readonly fullName = signal<string>('');
  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly confirmPassword = signal<string>('');

  // Field Touch & Form Submission Signals
  readonly fullNameTouched = signal<boolean>(false);
  readonly emailTouched = signal<boolean>(false);
  readonly passwordTouched = signal<boolean>(false);
  readonly confirmPasswordTouched = signal<boolean>(false);
  readonly isSubmitted = signal<boolean>(false);

  // UI State Signals
  readonly hidePassword = signal<boolean>(true);
  readonly hideConfirmPassword = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly registerMessage = signal<string | null>(null);

  // Computed Validation Signals
  readonly fullNameEmpty = computed(() => this.fullName().trim().length === 0);

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
      !this.fullNameEmpty() &&
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

    // Automatically append default role: 'CUSTOMER'
    const payload = {
      fullName: this.fullName().trim(),
      email: this.email().trim(),
      password: this.password(),
      role: 'CUSTOMER',
    };

    console.log('Registration payload submitted with default role via Signal Form:', payload);

    setTimeout(() => {
      this.isSubmitting.set(false);
      this.registerMessage.set('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1200);
    }, 1000);
  }
}
