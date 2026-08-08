import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { OrganizerHeaderComponent } from './components/organizer-header/organizer-header';
import { OrganizerMetricCardsComponent } from './components/organizer-metric-cards/organizer-metric-cards';
import { OrganizerTabsComponent, OrganizerTabType } from './components/organizer-tabs/organizer-tabs';
import { OrganizerTableComponent, OrganizerMovie } from './components/organizer-table/organizer-table';
import { OrganizerSlideOverDrawerComponent } from './components/organizer-slide-over-drawer/organizer-slide-over-drawer';
import { EventService, EventPayload } from '../../../../core/services/event.service';
import { VenueService, Venue } from '../../../../core/services/venue.service'; // 🟢 IMPORTED VENUE SERVICE

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
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
  private venueService = inject(VenueService); // 🟢 INJECTED

  // --- Core State Signals ---
  activeTab = signal<OrganizerTabType>('ALL');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);
  isDrawerOpen = signal<boolean>(false);
  selectedMovie = signal<OrganizerMovie | null>(null);

  organizerEmail = signal<string>('organizer@cinema.eg');
  organizerMovies = signal<OrganizerMovie[]>([]);

  // --- Venue Signals ---
  venues = signal<Venue[]>([]); // 🟢 ADDED: List of fetched venues

  // --- Drawer Form Signals ---
  formTitle = signal<string>('');
  formImageUrl = signal<string>('');
  formCategory = signal<string>('');
  formVenueId = signal<number | null>(null); // 🟢 REPLACED formVenueName WITH formVenueId
  formStartDate = signal<string>('');
  formStatus = signal<'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'>('DRAFT');

  ngOnInit(): void {
    this.loadEventsFromBackend();
    this.loadVenues(); // 🟢 FETCH VENUES ON COMPONENT INIT
  }

  // --- Backend API Integration ---

  /**
   * Fetches all registered venues from Spring Boot (/api/v1/venues)
   */
  loadVenues(): void {
    this.venueService.getVenues().subscribe({
      next: (venueList) => {
        this.venues.set(venueList);
        if (venueList.length > 0) {
          this.formVenueId.set(venueList[0].id); // Default to first venue
        }
      },
      error: (err) => {
        console.error('❌ Failed to load venues:', err);
      }
    });
  }

  /**
   * Fetches events from Spring Boot (/api/public/events or /api/v1/events)
   */
  loadEventsFromBackend(): void {
    this.eventService.getOrganizerEvents(0, 100).subscribe({
      next: (response: any) => {
        const eventsList = response?.content || response || [];

        // Map backend events into OrganizerMovie shape
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
      },
      error: (err) => {
        console.error('❌ Failed to load organizer events:', err);
      }
    });
  }

  /**
   * Sends POST request to Spring Boot to create/save the movie
   */
  saveDrawerMovie(): void {
    console.log('🚀 saveDrawerMovie() triggered!');

    const title = this.formTitle().trim();

    // 1. Title Validation Guard
    if (!title) {
      alert('Please enter a Movie Title before saving!');
      return;
    }

    // 2. Format date string (YYYY-MM-DDTHH:mm:ss)
    let rawDate = (this.formStartDate() || '').trim();
    if (rawDate && !rawDate.includes('T')) {
      rawDate = rawDate.replace(' ', 'T');
    }
    if (rawDate && rawDate.length === 16) {
      rawDate += ':00';
    }

    // 3. Status Clamp
    const currentStatus = this.formStatus();
    const validStatus: 'DRAFT' | 'PUBLISHED' =
      currentStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

    // 4. Venue Guard
    const selectedVenueId = this.formVenueId();
    if (!selectedVenueId) {
      alert('Please select a cinema venue');
      return;
    }

    // 5. Image URL Guard (Fall back to a standard placeholder if Base64 or empty)
    let finalImageUrl = this.formImageUrl().trim();
    if (!finalImageUrl) {
      // Standard placeholder image if uploaded file / empty
      finalImageUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba';
    }

    // 6. Construct Payload
    const payload: EventPayload = {
      title: title,
      description: `Movie screening for ${title}`,
      category: this.formCategory().trim() || 'General',
      startDate: rawDate,
      endDate: rawDate,
      status: validStatus,
      venueId: selectedVenueId,
      imageUrl: finalImageUrl
    };

    console.log('📤 Sending payload to Spring Boot:', payload);

    const currentSelected = this.selectedMovie();

    if (currentSelected && currentSelected.id) {
      this.eventService.updateEvent(currentSelected.id, payload).subscribe({
        next: (updatedMovie) => {
          console.log('✅ Movie updated successfully:', updatedMovie);
          this.loadEventsFromBackend();
          this.closeDrawer();
        },
        error: (err) => console.error('❌ Failed to update movie:', err)
      });
    } else {
      this.eventService.createEvent(payload).subscribe({
        next: (createdMovie) => {
          console.log('✅ Movie created successfully:', createdMovie);
          this.loadEventsFromBackend();
          this.closeDrawer();
        },
        error: (err) => {
          console.error('❌ Failed to create movie in Spring Boot:', err);
          alert('Validation failed on server: ' + JSON.stringify(err.error?.errors || err.error?.message));
        }
      });
    }
  }

  // --- Computed Metrics ---
  totalMovies = computed(() => this.organizerMovies().length);
  publishedMovies = computed(() => this.organizerMovies().filter((m) => m.status === 'PUBLISHED').length);
  draftMovies = computed(() => this.organizerMovies().filter((m) => m.status === 'DRAFT').length);
  completedMovies = computed(() => this.organizerMovies().filter((m) => m.status === 'COMPLETED').length);

  totalBookings = computed(() => this.organizerMovies().reduce((total, m) => total + (m.bookings || 0), 0));
  totalAttendees = computed(() => this.organizerMovies().reduce((total, m) => total + (m.attendees || 0), 0));

  // --- Computed Filtered & Paginated Movies ---
  filteredMovies = computed(() => {
    const tab = this.activeTab();
    if (tab === 'ALL') return this.organizerMovies();
    return this.organizerMovies().filter((m) => m.status === tab);
  });

  totalPages = computed(() => Math.ceil(this.filteredMovies().length / this.pageSize()) || 1);

  paginatedMovies = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredMovies().slice(start, start + this.pageSize());
  });

  pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  // --- Actions ---

  setActiveTab(tab: OrganizerTabType): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
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
    this.formImageUrl.set('');
    this.formCategory.set('Science Fiction');
    this.formVenueId.set(this.venues().length > 0 ? this.venues()[0].id : null); // 🟢 RESET TO FIRST VENUE ID
    this.formStartDate.set('2026-08-20T20:00:00');
    this.formStatus.set('DRAFT');
  }

  populateFormFields(movie: any): void {
    this.formTitle.set(movie.title || '');
    this.formImageUrl.set(movie.imageUrl || '');
    this.formCategory.set(movie.category || '');
    this.formVenueId.set(movie.venueId || (this.venues().length > 0 ? this.venues()[0].id : null)); // 🟢 POPULATE VENUE ID
    this.formStartDate.set(movie.startDate || '');
    this.formStatus.set(movie.status || 'DRAFT');
  }

  viewAttendees(movie: OrganizerMovie): void {
    if (this.router) {
      this.router.navigate(['/organizer/movies', movie.id, 'attendees']);
    }
  }

  deleteMovie(movie: OrganizerMovie): void {
    if (!movie.id) return;

    if (!confirm(`Are you sure you want to delete "${movie.title}"?`)) {
      return;
    }

    this.eventService.deleteEvent(movie.id).subscribe({
      next: () => {
        console.log(`✅ Movie with ID ${movie.id} deleted successfully from database.`);

        this.organizerMovies.update((list) => list.filter((m) => m.id !== movie.id));

        if (this.currentPage() > this.totalPages()) {
          this.currentPage.set(this.totalPages());
        }
      },
      error: (err) => {
        console.error('❌ Failed to delete event in Spring Boot:', err);
        alert('Failed to delete movie. Please try again.');
      }
    });
  }
}
