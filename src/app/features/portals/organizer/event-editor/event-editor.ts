import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event.service';

type MovieStatus = 'DRAFT' | 'PUBLISHED';

@Component({
  selector: 'app-event-editor',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './event-editor.html',
  styleUrl: './event-editor.css',
})
export class EventEditor implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);

  readonly movieId = signal<number | null>(null);
  readonly isEditMode = computed(() => this.movieId() !== null);

  readonly title = signal<string>('');
  readonly description = signal<string>('');
  readonly category = signal<string>('');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly status = signal<MovieStatus>('DRAFT');
  readonly venueId = signal<number | null>(null);

  readonly isSaving = signal<boolean>(false);
  readonly isSubmitted = signal<boolean>(false);
  readonly saveMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly categories = [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Romance',
    'Science Fiction',
    'Animation',
  ];

  readonly venues = [
    { id: 1, name: 'Cairo International Conference Center' },
    { id: 2, name: 'Al Manara Arts Center' },
  ];

  readonly isFormValid = computed(
    () =>
      this.title().trim().length > 0 &&
      this.category().length > 0 &&
      this.startDate().length > 0 &&
      this.endDate().length > 0 &&
      this.endDate() > this.startDate() &&
      this.venueId() !== null
  );

  ngOnInit(): void {
    const idParameter = this.route.snapshot.paramMap.get('id');

    if (idParameter) {
      const parsedId = Number(idParameter);
      if (!Number.isNaN(parsedId)) {
        this.movieId.set(parsedId);
        this.loadMovieForEditing(parsedId);
      }
    }
  }

  private loadMovieForEditing(movieId: number): void {
    this.eventService.getEventById(movieId).subscribe({
      next: (movie) => {
        this.title.set(movie.title ?? '');
        this.description.set(movie.description ?? '');
        this.category.set(movie.category ?? '');
        this.startDate.set(movie.startDate ? movie.startDate.substring(0, 16) : '');
        this.endDate.set(movie.endDate ? movie.endDate.substring(0, 16) : '');
        this.status.set(movie.status ?? 'DRAFT');
        this.venueId.set(movie.venueId ?? null);
      },
      error: (err) => {
        console.error('Failed to load event from backend:', err);
        this.errorMessage.set('Failed to load event details.');
      },
    });
  }

  onSubmit(): void {
    console.log('👉 onSubmit() WAS CALLED!');
    console.log('Form State:', {
      title: this.title(),
      category: this.category(),
      startDate: this.startDate(),
      endDate: this.endDate(),
      venueId: this.venueId(),
      isValid: this.isFormValid(),
    });

    this.isSubmitted.set(true);
    this.saveMessage.set(null);
    this.errorMessage.set(null);

    if (!this.isFormValid()) {
      console.warn('⚠️ Validation failed! Request cancelled.');
      return;
    }

    console.log('🚀 Sending POST request to backend...');
    this.isSaving.set(true);

    const moviePayload = {
      title: this.title().trim(),
      description: this.description().trim(),
      category: this.category(),
      startDate: `${this.startDate()}:00`,
      endDate: `${this.endDate()}:00`,
      status: this.status(),
      venueId: this.venueId(),
    };

    const request$ = this.isEditMode()
      ? this.eventService.updateEvent(this.movieId()!, moviePayload)
      : this.eventService.createEvent(moviePayload);

    request$.subscribe({
      next: (response) => {
        this.isSaving.set(false);
        this.saveMessage.set(
          this.isEditMode()
            ? 'Event updated successfully!'
            : 'Event created successfully!'
        );

        setTimeout(() => {
          this.router.navigate(['/organizer']);
        }, 1500);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('API Error:', err);
        this.errorMessage.set(
          err.error?.message || 'An error occurred while saving the event.'
        );
      },
    });
  }
}
