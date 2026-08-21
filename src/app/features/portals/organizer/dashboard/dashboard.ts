import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { form, required, min } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { OrganizerHeaderComponent } from './components/organizer-header/organizer-header';
import { OrganizerMetricCardsComponent } from './components/organizer-metric-cards/organizer-metric-cards';
import { OrganizerTabsComponent, OrganizerTabType } from './components/organizer-tabs/organizer-tabs';
import { AdminTableComponent, TableColumn, TableAction } from '../../../../shared/components/admin-table/admin-table';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer';
import { ORGANIZER_DRAWER_CONFIG } from './config/organizer-drawer.config';
import { SeatCategoryInput } from './components/forms/organizer-movie-form/organizer-movie-form';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { EventService, EventPayload } from '../../../../core/services/event.service';
import { VenueService, Venue } from '../../../../core/services/venue.service';
import { BookingService } from '../../../../core/services/booking.service';
import { EventResponse } from '../../../../core/models/event.model';
import { BookingResponse } from '../../../../core/models/booking.model';
import { PaginatedResponse } from '../../../../core/models/pagination.model';

export interface OrganizerMovie {
  id: number;
  title: string;
  category: string;
  startDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  venueId?: number;
  venueName: string;
  bookings: number;
  attendees: number;
  imageUrl?: string;
  director?: string;
  durationMinutes?: number | null;
  language?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    MatDialogModule,
    OrganizerHeaderComponent,
    OrganizerMetricCardsComponent,
    OrganizerTabsComponent,
    AdminTableComponent,
    DrawerComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {


  private router = inject(Router);
  private eventService = inject(EventService);
  private venueService = inject(VenueService);
  private bookingService = inject(BookingService);
  private dialog = inject(MatDialog);

  // --- Core State Signals ---
  activeTab = signal<OrganizerTabType>('ALL');
  currentPage = signal<number>(1);
  readonly pageSize = signal<number>(5); // Strict hardcoded page size 5
  totalServerPages = signal<number>(1);
  totalServerElements = signal<number>(0);

  organizerEmail = signal<string>('ciff-organizer@cinema.eg');
  organizerMovies = signal<OrganizerMovie[]>([]);
  organizerBookings = signal<BookingResponse[]>([]);

  // --- Total Catalog Metrics across Full Dataset ---
  totalMoviesCount = signal<number>(0);
  totalPublishedCount = signal<number>(0);
  totalDraftCount = signal<number>(0);
  totalCompletedCount = signal<number>(0);
  totalBookingsCount = signal<number>(0);
  totalAttendeesCount = signal<number>(0);

  // --- Table Columns & Actions Configurations ---
  readonly tableColumns: TableColumn<OrganizerMovie>[] = [
    { key: 'title', header: 'Movie Title', type: 'movieTitle' },
    { key: 'venueName', header: 'Cinema Venue', type: 'venuePill' },
    { key: 'startDate', header: 'Showtime & Date', type: 'date' },
    { key: 'status', header: 'Status', type: 'status' },
  ];

  readonly bookingColumns: TableColumn<BookingResponse>[] = [
    { key: 'bookingId', header: 'Booking #', format: (val) => `#${val}` },
    { key: 'customerName', header: 'Customer / Attendee', type: 'attendee' },
    { key: 'eventTitle', header: 'Movie Title' },
    { key: 'seatCategoryName', header: 'Seat Tier', type: 'badge' },
    { key: 'quantity', header: 'Tickets' },
    { key: 'totalPrice', header: 'Total', type: 'currency' },
    { key: 'status', header: 'Status', type: 'bookingStatusSelect' },
    { key: 'createdAt', header: 'Booked Date', type: 'date' },
  ];

  readonly tableActions: TableAction<OrganizerMovie>[] = [
    { id: 'edit', label: 'Edit Movie', icon: 'edit', cssClass: 'edit' },
    { id: 'attendees', label: 'View Bookings / Attendees', icon: 'groups', cssClass: 'attendees' },
    { id: 'delete', label: 'Delete Movie', icon: 'delete', cssClass: 'delete' },
  ];

  readonly currentTableColumns = computed<TableColumn[]>(() => {
    return this.activeTab() === 'BOOKINGS' ? (this.bookingColumns as TableColumn[]) : (this.tableColumns as TableColumn[]);
  });

  readonly currentTableActions = computed<TableAction[]>(() => {
    if (this.activeTab() === 'BOOKINGS') {
      return [
        {
          id: 'cancel',
          label: 'Cancel Booking',
          icon: 'cancel',
          cssClass: 'delete',
          disabled: (row: any) => row.status === 'CANCELLED',
        },
      ];
    }
    return this.tableActions as TableAction[];
  });

  readonly currentTableData = computed<any[]>(() => {
    if (this.activeTab() === 'BOOKINGS') {
      return this.organizerBookings();
    }
    return this.filteredMovies();
  });

  // --- Drawer State ---
  isDrawerOpen = signal<boolean>(false);
  selectedMovie = signal<OrganizerMovie | null>(null);

  // --- Venue Signals ---
  venues = signal<Venue[]>([]);

  // --- Seat Categories State ---
  readonly seatCategories = signal<SeatCategoryInput[]>([
    { name: 'STANDARD', price: 100, totalSeats: 50 },
    { name: 'VIP', price: 150, totalSeats: 20 },
    { name: 'IMAX', price: 200, totalSeats: 20 },
  ]);

  readonly activeDrawerConfig = computed(() => {
    const config = ORGANIZER_DRAWER_CONFIG['MOVIE'];
    if (!config) return null;
    const isEdit = !!this.selectedMovie();
    return {
      component: config.component,
      wide: config.wide,
      title: config.title(isEdit),
      subtitle: config.subtitle,
      submitLabel: config.submitLabel(isEdit),
      inputs: config.getInputs(this),
    };
  });


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
    this.loadCatalogTotals();
    this.loadEventsFromBackend(1);
    this.loadVenues();
  }

  loadCatalogTotals(): void {
    this.eventService.getOrganizerEvents(1, 1000).subscribe({
      next: (res) => {
        const allEvents = res.content || [];
        this.totalMoviesCount.set(res.totalElements || allEvents.length);
        this.totalPublishedCount.set(allEvents.filter((e: any) => e.status === 'PUBLISHED').length);
        this.totalDraftCount.set(allEvents.filter((e: any) => e.status === 'DRAFT').length);
        this.totalCompletedCount.set(allEvents.filter((e: any) => e.status === 'COMPLETED').length);
        this.totalBookingsCount.set(allEvents.reduce((sum: number, e: any) => sum + (e.bookingsCount || 0), 0));
        this.totalAttendeesCount.set(allEvents.reduce((sum: number, e: any) => sum + (e.attendeesCount || 0), 0));
      },
      error: () => {},
    });

    this.bookingService.getOrganizerBookings(1, 1).subscribe({
      next: (res) => {
        if (res?.totalElements != null) {
          this.totalBookingsCount.set(res.totalElements);
        }
      },
      error: () => {},
    });
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
        this.totalServerElements.set(res.totalElements || mappedMovies.length);
        if (res.totalElements != null) {
          this.totalMoviesCount.set(res.totalElements);
        }
      },
      error: (err) => {
        console.error('Failed to load organizer events:', err);
      }
    });
  }

  /**
   * Fetches page-by-page server-side paginated bookings for authenticated organizer (size = 5)
   */
  loadBookingsFromBackend(page: number = this.currentPage()): void {
    this.bookingService.getOrganizerBookings(page, this.pageSize()).subscribe({
      next: (res: PaginatedResponse<BookingResponse>) => {
        this.organizerBookings.set(res.content || []);
        this.totalServerPages.set(res.totalPages || 1);
        this.totalServerElements.set(res.totalElements || (res.content?.length ?? 0));
        if (res.totalElements != null) {
          this.totalBookingsCount.set(res.totalElements);
        }
      },
      error: (err) => {
        console.error('Failed to load organizer bookings:', err);
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

    // 🟢 Extract configured seat categories
    const seatCategoriesPayload = this.seatCategories()
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
          this.loadCatalogTotals();
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
          this.loadCatalogTotals();
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

  // --- Computed Metrics & Dashboard Summaries ---
  totalMovies = computed(() => this.totalMoviesCount() || this.totalServerElements() || this.organizerMovies().length);
  publishedMovies = computed(() => this.totalPublishedCount());
  draftMovies = computed(() => this.totalDraftCount());
  completedMovies = computed(() => this.totalCompletedCount());

  totalBookings = computed(() => this.totalBookingsCount());
  totalAttendees = computed(() => this.totalAttendeesCount());

  // --- Filtered Movies ---
  filteredMovies = computed(() => {
    const tab = this.activeTab();
    if (tab === 'ALL') return this.organizerMovies();
    return this.organizerMovies().filter((m) => m.status === tab);
  });

  totalItems = computed(() => {
    if (this.activeTab() === 'BOOKINGS') {
      return this.totalBookingsCount();
    }
    return this.filteredMovies().length;
  });

  totalPages = computed(() => Math.max(1, this.totalServerPages()));

  // Server-side paginated items
  paginatedMovies = computed(() => this.filteredMovies());

  pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });


  // --- Actions ---

  setActiveTab(tab: OrganizerTabType): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    if (tab === 'BOOKINGS') {
      this.loadBookingsFromBackend(1);
    } else {
      this.loadEventsFromBackend(1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      if (this.activeTab() === 'BOOKINGS') {
        this.loadBookingsFromBackend(page);
      } else {
        this.loadEventsFromBackend(page);
      }
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

            // Set the existing categories on the signal
            this.seatCategories.set(mappedCategories);
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
    this.seatCategories.set([
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


  handleTableAction(evt: { action: string; row: any }): void {
    if (evt.action === 'attendees') {
      this.viewAttendees(evt.row);
    } else if (evt.action === 'cancel') {
      this.cancelBooking(evt.row);
    }
  }

  /**
   * Prompts confirmation and invokes backend cancellation for an organizer's booking.
   */
  cancelBooking(booking: any): void {
    if (!booking || booking.status === 'CANCELLED') return;
    const bookingId = Number(booking.bookingId || booking.id);
    if (!bookingId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Booking?',
        message: `Are you sure you want to cancel booking #${booking.bookingId} for ${booking.customerName}? Seat capacity will be restored to your movie/event.`,
        confirmText: 'Cancel Booking',
        cancelText: 'Keep Booking',
        type: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.bookingService.cancelBooking(bookingId).subscribe({
          next: () => {
            this.loadCatalogTotals();
            this.loadBookingsFromBackend(this.currentPage());
          },
          error: (err) => {
            this.showErrorDialog('Cancellation Failed', err?.error?.message || 'Failed to cancel booking.');
          }
        });
      }
    });
  }

  /**
   * Updates status of an organizer's booking with role validation on server.
   */
  updateBookingStatus(booking: any, newStatus: string): void {
    if (!booking || !newStatus || booking.status === newStatus) return;

    if (booking.status === 'CANCELLED') {
      this.showErrorDialog('Invalid Action', 'Cancelled bookings cannot be reactivated.');
      return;
    }

    if (newStatus === 'CANCELLED') {
      this.cancelBooking(booking);
      return;
    }

    const bookingId = Number(booking.bookingId || booking.id);
    if (!bookingId) return;

    this.bookingService.updateBookingStatus(bookingId, newStatus as any).subscribe({
      next: () => {
        this.loadBookingsFromBackend(this.currentPage());
      },
      error: (err) => {
        this.showErrorDialog('Status Update Failed', err?.error?.message || 'Failed to update booking status.');
        this.loadBookingsFromBackend(this.currentPage());
      }
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
            this.loadCatalogTotals();
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
