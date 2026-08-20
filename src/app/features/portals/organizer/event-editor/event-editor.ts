import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { form, required, min, maxLength, validate, FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event.service';

export type MovieStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

@Component({
  selector: 'app-event-editor',
  standalone: true,
  imports: [
    FormField,
    FormRoot,
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

  // 1. Signal Forms Model Setup
  readonly eventModel = signal({
    title: '',
    description: '',
    category: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT' as MovieStatus,
    venueId: null as number | null,
    director: '',
    durationMinutes: null as number | null,
    language: '',
  });

  // 2. Signal Form Schema with Validators
  readonly eventForm = form(
    this.eventModel,
    (schema) => {
      required(schema.title, { message: 'Movie title is required' });
      maxLength(schema.title, 255);
      maxLength(schema.description, 2000);
      required(schema.category, { message: 'Genre is required' });
      required(schema.startDate, { message: 'Start date is required' });
      required(schema.endDate, { message: 'End date is required' });
      required(schema.venueId, { message: 'Cinema / Venue is required' });
      min(schema.durationMinutes, 1, { message: 'Duration must be at least 1 minute' });
      validate(schema.endDate, ({ value, valueOf }) => {
        const start = valueOf(schema.startDate);
        const end = value();
        if (start && end && end <= start) {
          return { kind: 'invalidRange', message: 'End date must be strictly after start date' };
        }
        return undefined;
      });
    },
    {
      submission: {
        action: async () => {
          this.onSubmit();
        },
      },
    }
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
      next: (movie: any) => {
        this.eventModel.set({
          title: movie.title ?? '',
          description: movie.description ?? '',
          category: movie.category ?? '',
          startDate: movie.startDate ? movie.startDate.substring(0, 16) : '',
          endDate: movie.endDate ? movie.endDate.substring(0, 16) : '',
          status: (movie.status ?? 'DRAFT') as MovieStatus,
          venueId: movie.venueId ?? null,
          director: movie.director ?? '',
          durationMinutes: movie.durationMinutes ?? null,
          language: movie.language ?? '',
        });
      },
      error: (err) => {
        console.error('Failed to load event from backend:', err);
        this.errorMessage.set('Failed to load event details.');
      },
    });
  }

  onSubmit(): void {
    this.isSubmitted.set(true);
    this.eventForm().markAsTouched();
    this.saveMessage.set(null);
    this.errorMessage.set(null);

    if (this.eventForm().invalid()) {
      console.warn('Form validation failed! Request cancelled.');
      return;
    }

    const formValues = this.eventModel();
    if (formValues.startDate && formValues.endDate && formValues.endDate <= formValues.startDate) {
      this.errorMessage.set('End date must be later than the start date');
      return;
    }

    this.isSaving.set(true);

    const moviePayload = {
      title: formValues.title.trim(),
      description: formValues.description ? formValues.description.trim() : '',
      category: formValues.category,
      startDate: formValues.startDate.length === 16 ? `${formValues.startDate}:00` : formValues.startDate,
      endDate: formValues.endDate.length === 16 ? `${formValues.endDate}:00` : formValues.endDate,
      status: formValues.status,
      venueId: formValues.venueId!,
      director: formValues.director ? formValues.director.trim() : undefined,
      durationMinutes: formValues.durationMinutes ? Number(formValues.durationMinutes) : undefined,
      language: formValues.language ? formValues.language.trim() : undefined,
    };

    const request$ = this.isEditMode()
      ? this.eventService.updateEvent(this.movieId()!, moviePayload)
      : this.eventService.createEvent(moviePayload);

    request$.subscribe({
      next: () => {
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

