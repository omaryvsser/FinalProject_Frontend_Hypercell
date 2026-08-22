import { Component, input, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Venue } from '../../../../../../../core/services/venue.service';


export type SeatCategoryName = 'STANDARD' | 'VIP' | 'IMAX';

export interface SeatCategoryInput {
  name: SeatCategoryName;
  price: number | null;
  totalSeats: number | null;
}

export interface OrganizerMovieFormModel {
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
  selector: 'app-organizer-movie-form',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './organizer-movie-form.html',
  styleUrl: './organizer-movie-form.css',
})
export class OrganizerMovieFormComponent {
  readonly form = input.required<any>();
  readonly model = input.required<WritableSignal<OrganizerMovieFormModel>>();
  readonly venues = input<Venue[]>([]);
  readonly seatCategories = input.required<WritableSignal<SeatCategoryInput[]>>();
  readonly isEdit = input<boolean>(false);

  readonly categoryOptions: SeatCategoryName[] = ['STANDARD', 'VIP', 'IMAX'];

  readonly categories = [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Romance',
    'Science Fiction',
    'Animation',
  ];

  getSelectedVenueName(): string {
    const currentId = this.form().venueId().value();
    const venue = this.venues().find((v) => +v.id === +currentId);
    return venue ? venue.name : '';
  }

  addSeatCategory(): void {
    this.seatCategories().update((cats) => [
      ...cats,
      { name: 'VIP', price: 150, totalSeats: 20 },
    ]);
  }

  removeSeatCategory(index: number): void {
    if (this.seatCategories()().length > 1) {
      this.seatCategories().update((cats) => cats.filter((_, i) => i !== index));
    }
  }

  onFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.files && inputEl.files[0]) {
      const file = inputEl.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const base64DataUrl = reader.result as string;
        this.model().update((m) => ({ ...m, imageUrl: base64DataUrl }));
      };

      reader.readAsDataURL(file);
    }
  }
}

