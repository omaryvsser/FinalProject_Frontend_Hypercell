import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminHeaderComponent } from './components/admin-header/admin-header';
import { MetricCardsComponent } from './components/metric-cards/metric-cards';
import { AdminTabsComponent } from './components/admin-tabs/admin-tabs';
import { DynamicTableComponent } from './components/dynamic-table/dynamic-table';
import { SlideOverDrawerComponent } from './components/slide-over-drawer/slide-over-drawer';
import { UserService } from '../../../../core/services/user.service';
import { VenueService } from '../../../../core/services/venue.service';
import { EventService } from '../../../../core/services/event.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserDto, UserRole } from '../../../../core/models/user.model';
import { EventResponse } from '../../../../core/models/event.model';

export type TabType = 'USERS' | 'ORGANIZERS' | 'VENUES' | 'MOVIES';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ORGANIZER' | 'CUSTOMER';
  joinedDate: string;
}

export interface OrganizerItem {
  id: string;
  name: string;
  email: string;
  company: string;
  joinedDate: string;
}

export interface VenueItem {
  id: string;
  name: string;
  address: string;
  capacity: number;
}

export interface MovieItem {
  id: string;
  title: string;
  genre: string;
  duration: string;
  rating: string;
  releaseDate: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AdminHeaderComponent,
    MetricCardsComponent,
    AdminTabsComponent,
    DynamicTableComponent,
    SlideOverDrawerComponent
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly venueService = inject(VenueService);
  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);

  // --- Core State Signals ---
  activeTab = signal<TabType>('USERS');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);
  isDrawerOpen = signal<boolean>(false);
  selectedItem = signal<any | null>(null);

  // Current logged in admin email
  currentUserEmail = signal<string>('');

  // --- Dynamic Backend Signals ---
  users = signal<UserItem[]>([]);
  organizers = signal<OrganizerItem[]>([]);
  venues = signal<VenueItem[]>([]);
  movies = signal<MovieItem[]>([]);
  isLoading = signal<boolean>(false);

  // --- Drawer Form Signals / Bindings ---
  formName = signal<string>('');
  formEmail = signal<string>('');
  formRole = signal<'ADMIN' | 'ORGANIZER' | 'CUSTOMER'>('CUSTOMER');
  formCompany = signal<string>('');

  formVenueName = signal<string>('');
  formAddress = signal<string>('');
  formCapacity = signal<number>(100);

  formTitle = signal<string>('');
  formGenre = signal<string>('');
  formDuration = signal<string>('120 min');
  formRating = signal<string>('PG-13');
  formReleaseDate = signal<string>('');

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user && user.email) {
      this.currentUserEmail.set(user.email);
    }
    this.loadAdminData();
  }

  /**
   * Fetches real live data from Spring Boot REST Endpoints
   */
  loadAdminData(): void {
    this.isLoading.set(true);

    // 1. Fetch system users from GET /api/admin/users
    this.userService.getAllUsers().subscribe({
      next: (dtos: UserDto[]) => {
        const mappedUsers: UserItem[] = (dtos || []).map((u) => ({
          id: String(u.id),
          name: u.name || u.email,
          email: u.email,
          role: (u.role || 'CUSTOMER') as 'ADMIN' | 'ORGANIZER' | 'CUSTOMER',
          joinedDate: '2026-08-01',
        }));
        this.users.set(mappedUsers);

        // Filter organizers
        const mappedOrgs: OrganizerItem[] = (dtos || [])
          .filter((u) => u.role === 'ORGANIZER')
          .map((u) => ({
            id: String(u.id),
            name: u.name || u.email,
            email: u.email,
            company: 'Event Organizer',
            joinedDate: '2026-08-01',
          }));
        this.organizers.set(mappedOrgs);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });

    // 2. Fetch venues from GET /api/venues
    this.venueService.getVenues().subscribe({
      next: (venueList) => {
        const mappedVenues: VenueItem[] = (venueList || []).map((v) => ({
          id: String(v.id),
          name: v.name,
          address: v.address || 'Cairo, Egypt',
          capacity: v.capacity || 500,
        }));
        this.venues.set(mappedVenues);
      },
    });

    // 3. Fetch public events from GET /api/public/events
    this.eventService.getPublicEvents(0, 100).subscribe({
      next: (pagedRes) => {
        const eventList: EventResponse[] = pagedRes?.content || [];
        const mappedMovies: MovieItem[] = eventList.map((e) => ({
          id: String(e.id),
          title: e.title,
          genre: e.category || 'General',
          duration: '120 min',
          rating: 'PG-13',
          releaseDate: e.startDate ? e.startDate.split('T')[0] : '2026-08-01',
        }));
        this.movies.set(mappedMovies);
      },
    });
  }

  // --- Computed Metrics (Top Overview Cards) ---
  totalUsersCount = computed(() => this.users().length);
  activeOrganizersCount = computed(() => this.organizers().length);
  registeredVenuesCount = computed(() => this.venues().length);
  totalMoviesCount = computed(() => this.movies().length);

  // --- Computed Pagination & Type-Safe Slice Signals ---
  totalItems = computed(() => {
    switch (this.activeTab()) {
      case 'USERS': return this.users().length;
      case 'ORGANIZERS': return this.organizers().length;
      case 'VENUES': return this.venues().length;
      case 'MOVIES': return this.movies().length;
    }
  });

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()) || 1);

  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.users().slice(start, start + this.pageSize());
  });

  paginatedOrganizers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.organizers().slice(start, start + this.pageSize());
  });

  paginatedVenues = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.venues().slice(start, start + this.pageSize());
  });

  paginatedMovies = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.movies().slice(start, start + this.pageSize());
  });

  pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  singularTabLabel = computed(() => {
    switch (this.activeTab()) {
      case 'USERS': return 'User';
      case 'ORGANIZERS': return 'Organizer';
      case 'VENUES': return 'Venue';
      case 'MOVIES': return 'Movie';
    }
  });

  // --- Actions & Methods ---

  setActiveTab(tab: TabType) {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  openAddDrawer() {
    this.selectedItem.set(null);
    this.resetFormFields();
    this.isDrawerOpen.set(true);
  }

  openEditDrawer(item: any) {
    this.selectedItem.set(item);
    this.populateFormFields(item);
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
    this.selectedItem.set(null);
  }

  resetFormFields() {
    this.formName.set('');
    this.formEmail.set('');
    this.formRole.set('CUSTOMER');
    this.formCompany.set('');
    this.formVenueName.set('');
    this.formAddress.set('');
    this.formCapacity.set(100);
    this.formTitle.set('');
    this.formGenre.set('');
    this.formDuration.set('120 min');
    this.formRating.set('PG-13');
    this.formReleaseDate.set('');
  }

  populateFormFields(item: any) {
    switch (this.activeTab()) {
      case 'USERS':
        this.formName.set(item.name || '');
        this.formEmail.set(item.email || '');
        this.formRole.set(item.role || 'CUSTOMER');
        break;
      case 'ORGANIZERS':
        this.formName.set(item.name || '');
        this.formEmail.set(item.email || '');
        this.formCompany.set(item.company || '');
        break;
      case 'VENUES':
        this.formVenueName.set(item.name || '');
        this.formAddress.set(item.address || '');
        this.formCapacity.set(item.capacity || 100);
        break;
      case 'MOVIES':
        this.formTitle.set(item.title || '');
        this.formGenre.set(item.genre || '');
        this.formDuration.set(item.duration || '120 min');
        this.formRating.set(item.rating || 'PG-13');
        this.formReleaseDate.set(item.releaseDate || '');
        break;
    }
  }

  saveDrawerItem() {
    const selected = this.selectedItem();
    const tab = this.activeTab();

    if (tab === 'VENUES') {
      const payload = {
        name: this.formVenueName(),
        address: this.formAddress(),
        capacity: Number(this.formCapacity()),
      };
      if (selected && selected.id) {
        this.venueService.updateVenue(Number(selected.id), payload).subscribe({
          next: () => {
            this.loadAdminData();
            this.closeDrawer();
          },
        });
      } else {
        this.venueService.createVenue(payload).subscribe({
          next: () => {
            this.loadAdminData();
            this.closeDrawer();
          },
        });
      }
    } else if (tab === 'USERS') {
      if (selected && selected.id) {
        this.userService.updateUserRole(Number(selected.id), this.formRole() as UserRole).subscribe({
          next: () => {
            this.loadAdminData();
            this.closeDrawer();
          },
        });
      } else {
        this.closeDrawer();
      }
    } else if (tab === 'MOVIES') {
      const payload = {
        title: this.formTitle(),
        description: `Admin movie: ${this.formTitle()}`,
        category: this.formGenre() || 'General',
        startDate: this.formReleaseDate() ? `${this.formReleaseDate()}T20:00:00` : '2026-08-25T20:00:00',
        endDate: this.formReleaseDate() ? `${this.formReleaseDate()}T22:00:00` : '2026-08-25T22:00:00',
        status: 'PUBLISHED' as const,
        venueId: 1,
        imageUrl: ''
      };

      if (selected && selected.id) {
        this.eventService.updateEvent(Number(selected.id), payload).subscribe({
          next: () => {
            this.loadAdminData();
            this.closeDrawer();
          }
        });
      } else {
        this.eventService.createEvent(payload).subscribe({
          next: (created) => {
            const newMovie: MovieItem = {
              id: String(created.id),
              title: created.title,
              genre: created.category || 'General',
              duration: '120 min',
              rating: 'PG-13',
              releaseDate: created.startDate ? created.startDate.split('T')[0] : '2026-08-25',
            };
            this.movies.update((current) => [newMovie, ...current]);
            this.loadAdminData();
            this.closeDrawer();
          }
        });
      }
    } else {
      this.closeDrawer();
    }
  }

  updateUserRole(user: UserItem, newRole: 'ADMIN' | 'CUSTOMER' | 'ORGANIZER') {
    if (user.email === this.currentUserEmail()) {
      return;
    }
    const numId = Number(user.id);
    if (!numId) return;

    this.userService.updateUserRole(numId, newRole as UserRole).subscribe({
      next: () => this.loadAdminData(),
      error: (err) => alert(err?.error?.message || 'Failed to update user role.'),
    });
  }

  deleteItem(item: any) {
    const tab = this.activeTab();
    const numId = Number(item.id);

    if (tab === 'USERS' || tab === 'ORGANIZERS') {
      if (item.email === this.currentUserEmail()) return;
      if (!numId) return;

      this.userService.deleteUser(numId).subscribe({
        next: () => this.loadAdminData(),
        error: (err) => alert(err?.error?.message || 'Failed to delete user.'),
      });
    } else if (tab === 'VENUES') {
      if (!numId) return;

      this.venueService.deleteVenue(numId).subscribe({
        next: () => this.loadAdminData(),
        error: (err) => alert(err?.error?.message || 'Failed to delete venue.'),
      });
    } else if (tab === 'MOVIES') {
      if (!numId) return;

      this.eventService.deleteEvent(numId).subscribe({
        next: () => this.loadAdminData(),
        error: (err) => alert(err?.error?.message || 'Failed to delete event.'),
      });
    }
  }

  isCurrentUser(email: string): boolean {
    return email === this.currentUserEmail();
  }
}
