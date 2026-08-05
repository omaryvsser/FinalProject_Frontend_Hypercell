import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';

type MovieStatus = 'DRAFT' | 'PUBLISHED';

interface EditableMovie {
  id: number;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  status: MovieStatus;
  venueId: number;
}

const TEMPORARY_ORGANIZER_MOVIES: Record<number, EditableMovie> = {
  1: {
    id: 1,
    title: 'Interstellar',
    description: 'A team travels through space to find a new home for humanity.',
    category: 'Science Fiction',
    startDate: '2026-08-14T20:00',
    endDate: '2026-08-14T23:00',
    status: 'PUBLISHED',
    venueId: 1,
  },
  2: {
    id: 2,
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with the Fremen while seeking revenge.',
    category: 'Science Fiction',
    startDate: '2026-08-20T19:30',
    endDate: '2026-08-20T22:30',
    status: 'DRAFT',
    venueId: 2,
  },
};

@Component({
  selector: 'app-event-editor',
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
  private readonly route = inject(ActivatedRoute);

  readonly movieId = signal<number | null>(null);

  readonly isEditMode = computed(
    () => this.movieId() !== null
  );

  readonly title = signal<string>('');
  readonly description = signal<string>('');
  readonly category = signal<string>('');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly status = signal<MovieStatus>('DRAFT');
  readonly venueId = signal<number | null>(null);

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
    {
      id: 1,
      name: 'Hypercell IMAX',
    },
    {
      id: 2,
      name: 'Hypercell Cinema',
    },
  ];

  readonly isSubmitted = signal<boolean>(false);
  readonly saveMessage = signal<string | null>(null);

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

    if (idParameter === null) {
      return;
    }

    const parsedId = Number(idParameter);

    if (!Number.isNaN(parsedId)) {
      this.movieId.set(parsedId);
      this.loadMovieForEditing(parsedId);
    }
  }

  private loadMovieForEditing(movieId: number): void {
    const movie = TEMPORARY_ORGANIZER_MOVIES[movieId];

    if (!movie) {
      return;
    }

    this.title.set(movie.title);
    this.description.set(movie.description);
    this.category.set(movie.category);
    this.startDate.set(movie.startDate);
    this.endDate.set(movie.endDate);
    this.status.set(movie.status);
    this.venueId.set(movie.venueId);
  }

  onSubmit(): void {
    this.isSubmitted.set(true);
    this.saveMessage.set(null);

    if (!this.isFormValid()) {
      return;
    }

    const moviePayload = {
      title: this.title().trim(),
      description: this.description().trim(),
      category: this.category(),
      startDate: `${this.startDate()}:00`,
      endDate: `${this.endDate()}:00`,
      status: this.status(),
      venueId: this.venueId(),
    };

    console.log('Movie payload ready:', moviePayload);

    this.saveMessage.set(
      'Movie information is valid and ready to be saved.'
    );
  }
}
