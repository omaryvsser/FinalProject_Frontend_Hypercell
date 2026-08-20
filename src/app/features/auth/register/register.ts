import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { form, required, email, minLength, validate, FormField, FormRoot } from '@angular/forms/signals';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormField,
    FormRoot,
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

  // 1. Signal Forms Model
  readonly registerModel = signal({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // 2. Signal Form Schema with Validators
  readonly registerForm = form(this.registerModel, (schema) => {
    required(schema.name, { message: 'Full name is required' });
    required(schema.email, { message: 'Email address is required' });
    email(schema.email, { message: 'Please enter a valid email address' });
    required(schema.password, { message: 'Password is required' });
    minLength(schema.password, 8, { message: 'Password must be at least 8 characters long' });
    required(schema.confirmPassword, { message: 'Please re-enter your password' });
    validate(schema.confirmPassword, ({ value, valueOf }) => {
      const pwd = valueOf(schema.password);
      const conf = value();
      if (conf && pwd && conf !== pwd) {
        return { kind: 'mismatch', message: 'Passwords do not match' };
      }
      return undefined;
    });
  });

  // 3. UI Control & Alert Signals
  readonly isSubmitted = signal<boolean>(false);
  readonly hidePassword = signal<boolean>(true);
  readonly hideConfirmPassword = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly registerMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((val) => !val);
  }

  // 4. Signal Forms Submission Handler
  onSubmit(): void {
    this.isSubmitted.set(true);
    this.registerForm().markAsTouched();

    if (this.registerForm().invalid()) {
      return;
    }

    this.isSubmitting.set(true);
    this.registerMessage.set(null);
    this.errorMessage.set(null);

    const model = this.registerModel();
    const payload = {
      name: model.name.trim(),
      email: model.email.trim(),
      password: model.password,
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

