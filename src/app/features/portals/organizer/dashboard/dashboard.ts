import { Component, signal, computed, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, required, min } from '@angular/forms/signals';
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

  organizerEmail = signal<string>('ciff-organizer@cinema.eg');
  organizerMovies = signal<OrganizerMovie[]>([]);

  // --- Drawer State ---
  isDrawerOpen = signal<boolean>(false);
  selectedMovie = signal<OrganizerMovie | null>(null);

  // --- Venue Signals ---
  venues = signal<Venue[]>([]);

  // --- Signal Form Model & Schema ---
  readonly movieModel = signal({
    title: '',
    description: '',
    imageUrl: '',
    category: 'Science Fiction',
    director: '',
    durationMinutes: null as number | null,
    language: '',
    venueId: null as number | null,
    startDate: '2026-08-20T20:00:00',
    endDate: '2026-08-20T22:00:00',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED',
  });

  readonly movieForm = form(this.movieModel, (schema) => {
    required(schema.title, { message: 'Movie title is required' });
    required(schema.category, { message: 'Category is required' });
    required(schema.startDate, { message: 'Start date is required' });
    required(schema.endDate, { message: 'End date is required' });
    required(schema.venueId, { message: 'Cinema venue is required' });
    min(schema.durationMinutes, 1, { message: 'Duration must be at least 1 minute' });
  });

  ngOnInit(): void {
    this.loadEventsFromBackend(1);
    this.loadVenues();
  }

  loadVenues(): void {
    this.venueService.getVenues().subscribe({
      next: (venueList) => {
        this.venues.set(venueList);
        if (venueList.length > 0 && !this.movieModel().venueId) {
          this.movieModel.update((m) => ({ ...m, venueId: venueList[0].id }));
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
    this.movieForm().markAsTouched();
    const val = this.movieModel();
    const title = val.title.trim();

    if (!title || this.movieForm().invalid()) {
      this.showErrorDialog('Validation Required', 'Please enter all required movie details before saving!');
      return;
    }

    // --- Dates formatting ---
    let rawDate = (val.startDate || '').trim();
    if (rawDate && !rawDate.includes('T')) rawDate = rawDate.replace(' ', 'T');
    if (rawDate && rawDate.length === 16) rawDate += ':00';

    let endDateVal = (val.endDate || rawDate).trim();
    if (endDateVal && !endDateVal.includes('T')) endDateVal = endDateVal.replace(' ', 'T');
    if (endDateVal && endDateVal.length === 16) endDateVal += ':00';

    const currentStatus = val.status;
    const validStatus: 'DRAFT' | 'PUBLISHED' =
      currentStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

    const selectedVenueId = val.venueId;
    if (!selectedVenueId) {
      this.showErrorDialog('Validation Required', 'Please select a cinema venue');
      return;
    }

    let finalImageUrl = val.imageUrl.trim();
    if (!finalImageUrl) {
      finalImageUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba';
    }

    // 🟢 Extract configured seat categories from the drawer component
    const seatCategoriesPayload = this.drawerComponent?.seatCategories()
      .filter(cat => cat.name && cat.price && cat.totalSeats)
      .map(cat => ({
        name: cat.name,
        price: Number(cat.price),
        totalSeats: Number(cat.totalSeats)
      })) || [];

    const payload: EventPayload = {
      title: title,
      description: val.description.trim() || `Movie screening for ${title}`,
      category: val.category.trim() || 'General',
      startDate: rawDate,
      endDate: endDateVal,
      status: validStatus,
      venueId: selectedVenueId,
      imageUrl: finalImageUrl,
      director: val.director.trim() || undefined,
      durationMinutes: val.durationMinutes ? Number(val.durationMinutes) : undefined,
      language: val.language.trim() || undefined,

      // 🟢 CRITICAL MISSING LINK: Send categories to Spring Boot!
      seatCategories: seatCategoriesPayload
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
        next: () => {
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

  // openAddDrawer(): void {
  //   this.selectedMovie.set(null);
  //   this.resetFormFields();
  //   this.isDrawerOpen.set(true);
  // }

  openEditDrawer(movie: OrganizerMovie): void {
    this.selectedMovie.set(movie);
    this.populateFormFields(movie);
    this.isDrawerOpen.set(true);

    if (movie.id) {
      // 🟢 Fetch seat categories for the specific movie being edited
      this.eventService.getSeatCategories(movie.id).subscribe({
        next: (categories) => {
          if (categories && categories.length > 0) {
            const mappedCategories = categories.map((cat: any) => ({
              name: cat.categoryName || cat.name,
              price: Number(cat.price),
              totalSeats: Number(cat.totalSeats)
            }));

            // Set the existing categories on the drawer component signal
            this.drawerComponent?.seatCategories.set(mappedCategories);
          } else {
            this.setDefaultDrawerCategories();
          }
        },
        error: (err) => {
          console.error(`Failed to load seat categories for event #${movie.id}:`, err);
          this.setDefaultDrawerCategories();
        }
      });
    }
  }

  openAddDrawer(): void {
    this.selectedMovie.set(null);
    this.resetFormFields();
    this.setDefaultDrawerCategories();
    this.isDrawerOpen.set(true);
  }

  private setDefaultDrawerCategories(): void {
    this.drawerComponent?.seatCategories.set([
      { name: 'STANDARD', price: 100, totalSeats: 50 },
      { name: 'VIP', price: 150, totalSeats: 20 },
      { name: 'IMAX', price: 200, totalSeats: 20 }
    ]);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.selectedMovie.set(null);
  }


  resetFormFields(): void {
    this.movieModel.set({
      title: '',
      description: '',
      imageUrl: '',
      category: 'Science Fiction',
      director: '',
      durationMinutes: null,
      language: '',
      venueId: this.venues().length > 0 ? this.venues()[0].id : null,
      startDate: '2026-08-20T20:00:00',
      endDate: '2026-08-20T22:00:00',
      status: 'DRAFT',
    });
  }

  populateFormFields(movie: any): void {
    this.movieModel.set({
      title: movie.title || '',
      description: movie.description || '',
      imageUrl: movie.imageUrl || '',
      category: movie.category || '',
      director: movie.director || '',
      durationMinutes: movie.durationMinutes || null,
      language: movie.language || '',
      venueId: movie.venueId || (this.venues().length > 0 ? this.venues()[0].id : null),
      startDate: movie.startDate || '',
      endDate: movie.endDate || movie.startDate || '',
      status: movie.status || 'DRAFT',
    });
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
  @ViewChild(OrganizerSlideOverDrawerComponent)
  drawerComponent!: OrganizerSlideOverDrawerComponent;
}
