import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event.service';

type MovieStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

@Component({
  selector: 'app-event-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
  private fb = inject(FormBuilder);

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

  // Reactive Form Group setup
  readonly eventForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(2000)]],
    category: ['', [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    status: ['DRAFT', [Validators.required]],
    venueId: [null as number | null, [Validators.required]],
    director: ['', [Validators.maxLength(150)]],
    durationMinutes: [null as number | null, [Validators.min(1)]],
    language: ['', [Validators.maxLength(100)]],
  });

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
        this.eventForm.patchValue({
          title: movie.title ?? '',
          description: movie.description ?? '',
          category: movie.category ?? '',
          startDate: movie.startDate ? movie.startDate.substring(0, 16) : '',
          endDate: movie.endDate ? movie.endDate.substring(0, 16) : '',
          status: movie.status ?? 'DRAFT',
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
    console.log(' onSubmit() WAS CALLED!');
    this.isSubmitted.set(true);
    this.saveMessage.set(null);
    this.errorMessage.set(null);

    if (this.eventForm.invalid) {
      console.warn(' Form validation failed! Request cancelled.');
      return;
    }

    const formValues = this.eventForm.value;
    if (formValues.startDate && formValues.endDate && formValues.endDate <= formValues.startDate) {
      this.errorMessage.set('End date must be later than the start date');
      return;
    }

    console.log(' Sending request to backend...');
    this.isSaving.set(true);

    const moviePayload = {
      title: formValues.title.trim(),
      description: formValues.description ? formValues.description.trim() : '',
      category: formValues.category,
      startDate: formValues.startDate.length === 16 ? `${formValues.startDate}:00` : formValues.startDate,
      endDate: formValues.endDate.length === 16 ? `${formValues.endDate}:00` : formValues.endDate,
      status: formValues.status,
      venueId: formValues.venueId,
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
