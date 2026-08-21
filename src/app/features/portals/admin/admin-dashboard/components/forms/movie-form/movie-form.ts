import { Component, input, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { VenueItem } from '../../../admin-dashboard';

export interface MovieFormModel {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  director: string;
  durationMinutes: number | null;
  language: string;
  venueId: number | null;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
}

@Component({
  selector: 'app-admin-movie-form',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './movie-form.html',
  styleUrl: './movie-form.css',
})
export class MovieFormComponent {
  readonly form = input.required<any>();
  readonly model = input.required<WritableSignal<MovieFormModel>>();
  readonly venues = input<VenueItem[]>([]);
  readonly isEdit = input<boolean>(false);

  readonly categories = [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Romance',
    'Science Fiction',
    'Animation',
  ];

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.model().update((m) => ({ ...m, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }
}
