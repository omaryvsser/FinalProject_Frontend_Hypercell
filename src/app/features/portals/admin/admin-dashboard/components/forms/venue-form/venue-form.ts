import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface VenueFormModel {
  name: string;
  address: string;
  capacity: number | null;
}

@Component({
  selector: 'app-venue-form',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './venue-form.html',
  styleUrl: './venue-form.css',
})
export class VenueFormComponent {
  readonly form = input.required<any>();
  readonly isEdit = input<boolean>(false);
}
