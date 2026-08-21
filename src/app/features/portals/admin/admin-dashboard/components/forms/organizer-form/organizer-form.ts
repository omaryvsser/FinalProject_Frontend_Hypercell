import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface OrganizerFormModel {
  name: string;
  email: string;
  company: string;
}

@Component({
  selector: 'app-organizer-form',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './organizer-form.html',
  styleUrl: './organizer-form.css',
})
export class OrganizerFormComponent {
  readonly form = input.required<any>();
  readonly isEdit = input<boolean>(false);
}
