import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { form, required, email, FormField, FormRoot } from '@angular/forms/signals';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // 1. Signal Forms Model
  readonly loginModel = signal({
    email: '',
    password: '',
  });

  // 2. Signal Form Schema with Validators
  readonly loginForm = form(
    this.loginModel,
    (schema) => {
      required(schema.email, { message: 'Email address is required' });
      email(schema.email, { message: 'Please enter a valid email address' });
      required(schema.password, { message: 'Password is required' });
    },
    {
      submission: {
        action: async () => {
          this.onSubmit();
        },
      },
    }
  );



  // 3. UI Control & Alert Signals
  readonly isSubmitted = signal<boolean>(false);
  readonly hidePassword = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly loginMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.hidePassword.update((visible) => !visible);
  }

  // 4. Signal Forms Submission Handler
  onSubmit(): void {
    this.isSubmitted.set(true);
    this.loginForm().markAsTouched();

    if (this.loginForm().invalid()) {
      return;
    }

    this.isSubmitting.set(true);
    this.loginMessage.set(null);
    this.errorMessage.set(null);

    const payload = {
      email: this.loginModel().email.trim(),
      password: this.loginModel().password,
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

