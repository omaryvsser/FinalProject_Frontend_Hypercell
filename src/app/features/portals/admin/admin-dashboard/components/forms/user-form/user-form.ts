import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

export interface UserFormModel {
  name: string;
  email: string;
  role: 'ADMIN' | 'ORGANIZER' | 'CUSTOMER';
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserFormComponent {
  readonly form = input.required<any>();
  readonly isEdit = input<boolean>(false);
  readonly isCurrentLoggedInUser = input<boolean>(false);
}
