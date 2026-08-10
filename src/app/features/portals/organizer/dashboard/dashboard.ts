import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { OrganizerHeaderComponent } from './components/organizer-header/organizer-header';
import { OrganizerMetricCardsComponent } from './components/organizer-metric-cards/organizer-metric-cards';
import { OrganizerTabsComponent, OrganizerTabType } from './components/organizer-tabs/organizer-tabs';
import { OrganizerTableComponent, OrganizerMovie } from './components/organizer-table/organizer-table';
import { OrganizerSlideOverDrawerComponent } from './components/organizer-slide-over-drawer/organizer-slide-over-drawer';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { EventService, EventPayload } from '../../../../core/services/event.service';
import { VenueService, Venue } from '../../../../core/services/venue.service';
import { EventResponse } from '../../../../core/models/event.model';
import { PaginatedResponse } from '../../../../core/models/pagination.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    OrganizerHeaderComponent,
    OrganizerMetricCardsComponent,
    OrganizerTabsComponent,
    OrganizerTableComponent,
    OrganizerSlideOverDrawerComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private router = inject(Router);
  private eventService = inject(EventService);
  private venueService = inject(VenueService);
  private dialog = inject(MatDialog);

  // --- Core State Signals ---
  activeTab = signal<OrganizerTabType>('ALL');
  currentPage = signal<number>(1);
  readonly pageSize = signal<number>(5); // Strict hardcoded page size 5
  totalServerPages = signal<number>(1);
  totalServerElements = signal<number>(0);

  isDrawerOpen = signal<boolean>(false);
  selectedMovie = signal<OrganizerMovie | null>(null);

  organizerEmail = signal<string>('organizer@cinema.eg');
  organizerMovies = signal<OrganizerMovie[]>([]);

  // --- Venue Signals ---
  venues = signal<Venue[]>([]);

  // --- Drawer Form Signals ---
  formTitle = signal<string>('');
  formDescription = signal<string>('');
  formImageUrl = signal<string>('');
  formCategory = signal<string>('');
  formDirector = signal<string>('');
  formDurationMinutes = signal<number | null>(null);
  formLanguage = signal<string>('');
  formVenueId = signal<number | null>(null);
  formStartDate = signal<string>('');
  formEndDate = signal<string>('');
  formStatus = signal<'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'>('DRAFT');

  ngOnInit(): void {
    this.loadEventsFromBackend(1);
    this.loadVenues();
  }

  loadVenues(): void {
    this.venueService.getVenues().subscribe({
      next: (venueList) => {
        this.venues.set(venueList);
        if (venueList.length > 0) {
          this.formVenueId.set(venueList[0].id);
        }
      },
      error: (err) => {
        console.error('Failed to load venues:', err);
      }
    });
  }

  /**
   * Fetches page-by-page server-side paginated events from Spring Boot (size = 5)
   */
  loadEventsFromBackend(page: number = this.currentPage()): void {
    this.eventService.getOrganizerEvents(page, 5).subscribe({
      next: (res: PaginatedResponse<EventResponse>) => {
        const eventsList = res.content || [];

        const mappedMovies: OrganizerMovie[] = eventsList.map((event: any) => ({
          id: event.id,
          title: event.title,
          imageUrl: event.imageUrl,
          category: event.category || 'General',
          startDate: event.startDate,
          status: event.status || 'DRAFT',
          venueId: event.venue?.id || event.venueId,
          venueName: event.venueName || event.venue?.name || 'Cinema Venue',
          bookings: event.bookingsCount || 0,
          attendees: event.attendeesCount || 0,
        }));

        this.organizerMovies.set(mappedMovies);
        this.totalServerPages.set(res.totalPages || 1);
        this.totalServerElements.set(res.totalElements || 0);
      },
      error: (err) => {
        console.error('Failed to load organizer events:', err);
      }
    });
  }

  saveDrawerMovie(): void {
    const title = this.formTitle().trim();

    if (!title) {
      this.showErrorDialog('Validation Required', 'Please enter a Movie Title before saving!');
      return;
    }

    let rawDate = (this.formStartDate() || '').trim();
    if (rawDate && !rawDate.includes('T')) {
      rawDate = rawDate.replace(' ', 'T');
    }
    if (rawDate && rawDate.length === 16) {
      rawDate += ':00';
    }

    let endDateVal = (this.formEndDate() || rawDate).trim();
    if (endDateVal && !endDateVal.includes('T')) {
      endDateVal = endDateVal.replace(' ', 'T');
    }
    if (endDateVal && endDateVal.length === 16) {
      endDateVal += ':00';
    }

    const currentStatus = this.formStatus();
    const validStatus: 'DRAFT' | 'PUBLISHED' =
      currentStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

    const selectedVenueId = this.formVenueId();
    if (!selectedVenueId) {
      this.showErrorDialog('Validation Required', 'Please select a cinema venue');
      return;
    }

    let finalImageUrl = this.formImageUrl().trim();
    if (!finalImageUrl) {
      finalImageUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba';
    }

    const payload: EventPayload = {
      title: title,
      description: this.formDescription().trim() || `Movie screening for ${title}`,
      category: this.formCategory().trim() || 'General',
      startDate: rawDate,
      endDate: endDateVal,
      status: validStatus,
      venueId: selectedVenueId,
      imageUrl: finalImageUrl,
      director: this.formDirector().trim() || undefined,
      durationMinutes: this.formDurationMinutes() ? Number(this.formDurationMinutes()) : undefined,
      language: this.formLanguage().trim() || undefined,
    };

    const currentSelected = this.selectedMovie();

    if (currentSelected && currentSelected.id) {
      this.eventService.updateEvent(currentSelected.id, payload).subscribe({
        next: () => {
          this.loadEventsFromBackend(this.currentPage());
          this.closeDrawer();
        },
        error: (err) => {
          console.error('Failed to update movie:', err);
          this.showErrorDialog('Update Failed', err?.error?.message || 'Failed to update movie.');
        }
      });
    } else {
      this.eventService.createEvent(payload).subscribe({
        next: (createdMovie) => {
          const selectedVenue = this.venues().find((v) => v.id === payload.venueId);
          const newMappedMovie: OrganizerMovie = {
            id: createdMovie.id,
            title: createdMovie.title,
            category: createdMovie.category || payload.category || 'General',
            startDate: createdMovie.startDate || payload.startDate || '',
            status: (createdMovie.status || payload.status || 'DRAFT') as any,
            venueName: createdMovie.venueName || selectedVenue?.name || 'Cinema Venue',
            bookings: 0,
            attendees: 0,
          };

          this.organizerMovies.update((current) => [newMappedMovie, ...current]);
          this.loadEventsFromBackend(this.currentPage());
          this.closeDrawer();
        },
        error: (err) => {
          console.error('Failed to create movie in Spring Boot:', err);
          this.showErrorDialog(
            'Validation Error',
            err.error?.message || 'Validation failed on server.'
          );
        }
      });
    }
  }

  // --- Computed Metrics ---
  totalMovies = computed(() => this.totalServerElements() || this.organizerMovies().length);
  publishedMovies = computed(() => this.organizerMovies().filter((m) => m.status === 'PUBLISHED').length);
  draftMovies = computed(() => this.organizerMovies().filter((m) => m.status === 'DRAFT').length);
  completedMovies = computed(() => this.organizerMovies().filter((m) => m.status === 'COMPLETED').length);

  totalBookings = computed(() => this.organizerMovies().reduce((total, m) => total + (m.bookings || 0), 0));
  totalAttendees = computed(() => this.organizerMovies().reduce((total, m) => total + (m.attendees || 0), 0));

  // --- Filtered Movies ---
  filteredMovies = computed(() => {
    const tab = this.activeTab();
    if (tab === 'ALL') return this.organizerMovies();
    return this.organizerMovies().filter((m) => m.status === tab);
  });

  totalPages = computed(() => Math.max(1, this.totalServerPages()));

  // Server-side paginated items (no frontend array slicing)
  paginatedMovies = computed(() => this.filteredMovies());

  pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  // --- Actions ---

  setActiveTab(tab: OrganizerTabType): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadEventsFromBackend(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadEventsFromBackend(page);
    }
  }

  openAddDrawer(): void {
    this.selectedMovie.set(null);
    this.resetFormFields();
    this.isDrawerOpen.set(true);
  }

  openEditDrawer(movie: OrganizerMovie): void {
    this.selectedMovie.set(movie);
    this.populateFormFields(movie);
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.selectedMovie.set(null);
  }

  resetFormFields(): void {
    this.formTitle.set('');
    this.formDescription.set('');
    this.formImageUrl.set('');
    this.formCategory.set('Science Fiction');
    this.formDirector.set('');
    this.formDurationMinutes.set(null);
    this.formLanguage.set('');
    this.formVenueId.set(this.venues().length > 0 ? this.venues()[0].id : null);
    this.formStartDate.set('2026-08-20T20:00:00');
    this.formEndDate.set('2026-08-20T22:00:00');
    this.formStatus.set('DRAFT');
  }

  populateFormFields(movie: any): void {
    this.formTitle.set(movie.title || '');
    this.formDescription.set(movie.description || '');
    this.formImageUrl.set(movie.imageUrl || '');
    this.formCategory.set(movie.category || '');
    this.formDirector.set(movie.director || '');
    this.formDurationMinutes.set(movie.durationMinutes || null);
    this.formLanguage.set(movie.language || '');
    this.formVenueId.set(movie.venueId || (this.venues().length > 0 ? this.venues()[0].id : null));
    this.formStartDate.set(movie.startDate || '');
    this.formEndDate.set(movie.endDate || movie.startDate || '');
    this.formStatus.set(movie.status || 'DRAFT');
  }

  viewAttendees(movie: OrganizerMovie): void {
    if (this.router) {
      this.router.navigate(['/organizer/movies', movie.id, 'attendees']);
    }
  }

  deleteMovie(movie: OrganizerMovie): void {
    if (!movie.id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Movie',
        message: `Are you sure you want to delete "${movie.title}"? This action cannot be undone.`,
        confirmText: 'Delete Movie',
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.eventService.deleteEvent(movie.id!).subscribe({
          next: () => {
            console.log(`Movie with ID ${movie.id} deleted successfully from database.`);
            this.loadEventsFromBackend(this.currentPage());
          },
          error: (err) => {
            console.error('Failed to delete event in Spring Boot:', err);
            this.showErrorDialog('Deletion Failed', 'Failed to delete movie. Please try again.');
          }
        });
      }
    });
  }

  private showErrorDialog(title: string, message: string): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title,
        message,
        confirmText: 'OK',
        type: 'warning',
      },
    });
  }
}
