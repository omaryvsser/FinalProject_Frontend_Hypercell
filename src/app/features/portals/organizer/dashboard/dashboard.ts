import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { OrganizerHeaderComponent } from './components/organizer-header/organizer-header';
import { OrganizerMetricCardsComponent } from './components/organizer-metric-cards/organizer-metric-cards';
import { OrganizerTabsComponent, OrganizerTabType } from './components/organizer-tabs/organizer-tabs';
import { OrganizerTableComponent, OrganizerMovie } from './components/organizer-table/organizer-table';
import { OrganizerSlideOverDrawerComponent } from './components/organizer-slide-over-drawer/organizer-slide-over-drawer';

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
export class Dashboard {
  private router: Router | null = null;

  constructor() {
    try {
      this.router = inject(Router);
    } catch {
      this.router = null;
    }
  }

  // --- Core State Signals ---
  activeTab = signal<OrganizerTabType>('ALL');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);
  isDrawerOpen = signal<boolean>(false);
  selectedMovie = signal<OrganizerMovie | null>(null);

  organizerEmail = signal<string>('organizer@cinema.eg');

  // --- Mock Organizer Movies Signal ---
  organizerMovies = signal<OrganizerMovie[]>([
    {
      id: 1,
      title: 'Interstellar',
      category: 'Science Fiction',
      startDate: '2026-08-14T20:00:00',
      status: 'PUBLISHED',
      venueName: 'Vox Cinema Mall of Egypt',
      bookings: 32,
      attendees: 58,
    },
    {
      id: 2,
      title: 'Dune: Part Two',
      category: 'Science Fiction',
      startDate: '2026-08-20T19:30:00',
      status: 'DRAFT',
      venueName: 'Sea Cinema El Gouna',
      bookings: 0,
      attendees: 0,
    },
    {
      id: 3,
      title: 'Kira & El Gin',
      category: 'Action / Drama',
      startDate: '2026-08-10T19:30:00',
      status: 'PUBLISHED',
      venueName: 'Cairo Opera House Main Hall',
      bookings: 145,
      attendees: 210,
    },
    {
      id: 4,
      title: 'The Blue Elephant 2',
      category: 'Horror / Mystery',
      startDate: '2026-07-25T21:00:00',
      status: 'COMPLETED',
      venueName: 'Zawya Cinema Downtown',
      bookings: 220,
      attendees: 220,
    },
    {
      id: 5,
      title: 'Voy! Voy! Voy!',
      category: 'Comedy / Drama',
      startDate: '2026-08-01T18:00:00',
      status: 'COMPLETED',
      venueName: 'San Stefano Grand Cinema',
      bookings: 180,
      attendees: 180,
    },
    {
      id: 6,
      title: 'Welad Rizk 3: El Qadia',
      category: 'Action / Crime',
      startDate: '2026-08-25T20:00:00',
      status: 'PUBLISHED',
      venueName: 'Galaxy Cinema El Manial',
      bookings: 89,
      attendees: 110,
    },
  ]);

  // --- Drawer Form Signals ---
  formTitle = signal<string>('');
  formCategory = signal<string>('');
  formVenueName = signal<string>('');
  formStartDate = signal<string>('');
  formStatus = signal<'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'>('DRAFT');

  // --- Computed Metrics ---
  totalMovies = computed(() => this.organizerMovies().length);
  publishedMovies = computed(() => this.organizerMovies().filter((m) => m.status === 'PUBLISHED').length);
  draftMovies = computed(() => this.organizerMovies().filter((m) => m.status === 'DRAFT').length);
  completedMovies = computed(() => this.organizerMovies().filter((m) => m.status === 'COMPLETED').length);

  totalBookings = computed(() => this.organizerMovies().reduce((total, m) => total + m.bookings, 0));
  totalAttendees = computed(() => this.organizerMovies().reduce((total, m) => total + m.attendees, 0));

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

  setActiveTab(tab: OrganizerTabType) {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  openAddDrawer() {
    this.selectedMovie.set(null);
    this.resetFormFields();
    this.isDrawerOpen.set(true);
  }

  openEditDrawer(movie: OrganizerMovie) {
    this.selectedMovie.set(movie);
    this.populateFormFields(movie);
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
    this.selectedMovie.set(null);
  }

  resetFormFields() {
    this.formTitle.set('');
    this.formCategory.set('Science Fiction');
    this.formVenueName.set('Vox Cinema Mall of Egypt');
    this.formStartDate.set('2026-08-20 20:00');
    this.formStatus.set('DRAFT');
  }

  populateFormFields(movie: OrganizerMovie) {
    this.formTitle.set(movie.title || '');
    this.formCategory.set(movie.category || '');
    this.formVenueName.set(movie.venueName || '');
    this.formStartDate.set(movie.startDate || '');
    this.formStatus.set(movie.status || 'DRAFT');
  }

  saveDrawerMovie() {
    const selected = this.selectedMovie();

    if (selected) {
      this.organizerMovies.update((list) =>
        list.map((m) =>
          m.id === selected.id
            ? {
                ...m,
                title: this.formTitle(),
                category: this.formCategory(),
                venueName: this.formVenueName(),
                startDate: this.formStartDate(),
                status: this.formStatus(),
              }
            : m
        )
      );
    } else {
      const newMov: OrganizerMovie = {
        id: Date.now(),
        title: this.formTitle() || 'New Organizer Movie',
        category: this.formCategory() || 'Drama',
        venueName: this.formVenueName() || 'Vox Cinema Mall of Egypt',
        startDate: this.formStartDate() || '2026-09-01 20:00',
        status: this.formStatus(),
        bookings: 0,
        attendees: 0,
      };
      this.organizerMovies.update((list) => [newMov, ...list]);
    }

    this.closeDrawer();
  }

  deleteMovie(movie: OrganizerMovie) {
    this.organizerMovies.update((list) => list.filter((m) => m.id !== movie.id));
    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }
  }

  viewAttendees(movie: OrganizerMovie) {
    if (this.router) {
      this.router.navigate(['/organizer/movies', movie.id, 'attendees']);
    }
  }
}
