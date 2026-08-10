import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminHeaderComponent } from './components/admin-header/admin-header';
import { MetricCardsComponent } from './components/metric-cards/metric-cards';
import { AdminTabsComponent } from './components/admin-tabs/admin-tabs';
import { DynamicTableComponent } from './components/dynamic-table/dynamic-table';
import { SlideOverDrawerComponent } from './components/slide-over-drawer/slide-over-drawer';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { UserService } from '../../../../core/services/user.service';
import { VenueService } from '../../../../core/services/venue.service';
import { EventService } from '../../../../core/services/event.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserDto, UserRole } from '../../../../core/models/user.model';
import { EventResponse } from '../../../../core/models/event.model';
import { PaginatedResponse } from '../../../../core/models/pagination.model';

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
    MatDialogModule,
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
  private readonly dialog = inject(MatDialog);

  // --- Core State Signals ---
  activeTab = signal<TabType>('USERS');
  currentPage = signal<number>(1);
  readonly pageSize = signal<number>(5); // Strict hardcoded page size 5
  totalServerPages = signal<number>(1);
  totalServerElements = signal<number>(0);

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
  formDescription = signal<string>('');
  formImageUrl = signal<string>('');
  formGenre = signal<string>('Action');
  formStatus = signal<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  formDirector = signal<string>('');
  formDurationMinutes = signal<number | string>(120);
  formLanguage = signal<string>('English');
  formStartDate = signal<string>('');
  formEndDate = signal<string>('');
  formVenueId = signal<number>(1);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user && user.email) {
      this.currentUserEmail.set(user.email);
    }
    this.loadAdminData(1);
  }

  /**
   * Fetches page-by-page server-side paginated data from Spring Boot REST Endpoints (size = 5)
   */
  loadAdminData(page: number = this.currentPage()): void {
    this.isLoading.set(true);
    const currentTab = this.activeTab();

    if (currentTab === 'USERS' || currentTab === 'ORGANIZERS') {
      this.userService.getPaginatedUsers(page, 5).subscribe({
        next: (res: PaginatedResponse<UserDto>) => {
          const mappedUsers: UserItem[] = (res.content || []).map((u) => ({
            id: String(u.id),
            name: u.name || u.email,
            email: u.email,
            role: (u.role || 'CUSTOMER') as 'ADMIN' | 'ORGANIZER' | 'CUSTOMER',
            joinedDate: '2026-08-01',
          }));
          this.users.set(mappedUsers);

          const mappedOrgs: OrganizerItem[] = (res.content || [])
            .filter((u) => u.role === 'ORGANIZER')
            .map((u) => ({
              id: String(u.id),
              name: u.name || u.email,
              email: u.email,
              company: 'Event Organizer',
              joinedDate: '2026-08-01',
            }));
          this.organizers.set(mappedOrgs);

          this.totalServerPages.set(res.totalPages || 1);
          this.totalServerElements.set(res.totalElements || 0);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    } else if (currentTab === 'VENUES') {
      this.venueService.getPaginatedVenues(page, 5).subscribe({
        next: (res) => {
          const mappedVenues: VenueItem[] = (res.content || []).map((v) => ({
            id: String(v.id),
            name: v.name,
            address: v.address || 'Cairo, Egypt',
            capacity: v.capacity || 500,
          }));
          this.venues.set(mappedVenues);
          this.totalServerPages.set(res.totalPages || 1);
          this.totalServerElements.set(res.totalElements || 0);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    } else if (currentTab === 'MOVIES') {
      this.eventService.getOrganizerEvents(page, 5).subscribe({
        next: (res) => {
          const eventList: EventResponse[] = res.content || [];
          const mappedMovies: MovieItem[] = eventList.map((e) => ({
            id: String(e.id),
            title: e.title,
            genre: e.category || 'General',
            duration: '120 min',
            rating: 'PG-13',
            releaseDate: e.startDate ? e.startDate.split('T')[0] : '2026-08-01',
          }));
          this.movies.set(mappedMovies);
          this.totalServerPages.set(res.totalPages || 1);
          this.totalServerElements.set(res.totalElements || 0);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  // --- Computed Metrics ---
  totalUsersCount = computed(() => this.users().length);
  activeOrganizersCount = computed(() => this.organizers().length);
  registeredVenuesCount = computed(() => this.venues().length);
  totalMoviesCount = computed(() => this.movies().length);

  totalItems = computed(() => this.totalServerElements() || this.totalUsersCount());
  totalPages = computed(() => Math.max(1, this.totalServerPages()));

  // Server-side paginated content (no frontend array slicing)
  paginatedUsers = computed(() => this.users());
  paginatedOrganizers = computed(() => this.organizers());
  paginatedVenues = computed(() => this.venues());
  paginatedMovies = computed(() => this.movies());

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

  // --- Server-Side Pagination Actions ---

  setActiveTab(tab: TabType) {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadAdminData(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadAdminData(page);
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
    this.formDescription.set('');
    this.formImageUrl.set('');
    this.formGenre.set('Action');
    this.formStatus.set('PUBLISHED');
    this.formDirector.set('');
    this.formDurationMinutes.set(120);
    this.formLanguage.set('English');
    this.formStartDate.set('');
    this.formEndDate.set('');
    const firstVenue = this.venues().length > 0 ? Number(this.venues()[0].id) : 1;
    this.formVenueId.set(firstVenue);
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
        this.formDescription.set(item.description || '');
        this.formImageUrl.set(item.imageUrl || '');
        this.formGenre.set(item.genre || 'Action');
        this.formStatus.set(item.status || 'PUBLISHED');
        this.formDirector.set(item.director || '');
        this.formDurationMinutes.set(item.durationMinutes || item.duration || 120);
        this.formLanguage.set(item.language || 'English');
        this.formStartDate.set(item.startDate || '');
        this.formEndDate.set(item.endDate || '');
        this.formVenueId.set(item.venueId ? Number(item.venueId) : (this.venues().length > 0 ? Number(this.venues()[0].id) : 1));
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
          error: (err) => this.showErrorDialog('Update Failed', err?.error?.message || 'Failed to update venue.')
        });
      } else {
        this.venueService.createVenue(payload).subscribe({
          next: () => {
            this.loadAdminData();
            this.closeDrawer();
          },
          error: (err) => this.showErrorDialog('Creation Failed', err?.error?.message || 'Failed to create venue.')
        });
      }
    } else if (tab === 'USERS') {
      if (selected && selected.id) {
        const targetRoleId = Number(selected.id);
        const requestedRole = this.formRole() as UserRole;
        this.userService.updateUserRole(targetRoleId, requestedRole).subscribe({
          next: (updatedDto) => {
            const targetRole = (updatedDto?.role || requestedRole) as 'ADMIN' | 'ORGANIZER' | 'CUSTOMER';
            this.users.update((current) =>
              current.map((u) => (u.id === String(targetRoleId) ? { ...u, role: targetRole } : u))
            );
            this.syncOrganizersSignal();
            this.closeDrawer();
          },
          error: (err) => this.showErrorDialog('Role Update Failed', err?.error?.message || 'Failed to update user role.'),
        });
      } else {
        this.closeDrawer();
      }
    } else if (tab === 'MOVIES') {
      const sDate = this.formStartDate();
      const eDate = this.formEndDate();

      let imgUrl = this.formImageUrl().trim();
      if (!imgUrl) {
        imgUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba';
      }

      const payload = {
        title: this.formTitle().trim(),
        description: this.formDescription() ? this.formDescription().trim() : '',
        category: this.formGenre() || 'Action',
        startDate: sDate ? (sDate.length === 16 ? `${sDate}:00` : sDate) : '2026-08-25T20:00:00',
        endDate: eDate ? (eDate.length === 16 ? `${eDate}:00` : eDate) : '2026-08-25T22:00:00',
        status: this.formStatus() || 'PUBLISHED',
        venueId: Number(this.formVenueId()) || 1,
        director: this.formDirector() ? this.formDirector().trim() : undefined,
        durationMinutes: Number(this.formDurationMinutes()) || 120,
        language: this.formLanguage() ? this.formLanguage().trim() : undefined,
        imageUrl: imgUrl
      };

      if (selected && selected.id) {
        this.eventService.updateEvent(Number(selected.id), payload).subscribe({
          next: () => {
            this.loadAdminData();
            this.closeDrawer();
          },
          error: (err) => this.showErrorDialog('Update Failed', err?.error?.message || 'Failed to update movie.')
        });
      } else {
        this.eventService.createEvent(payload).subscribe({
          next: (created) => {
            const newMovie: MovieItem = {
              id: String(created.id),
              title: created.title,
              genre: created.category || 'Action',
              duration: `${created.durationMinutes || 120} min`,
              rating: 'PG-13',
              releaseDate: created.startDate ? created.startDate.split('T')[0] : '2026-08-25',
            };
            this.movies.update((current) => [newMovie, ...current]);
            this.loadAdminData();
            this.closeDrawer();
          },
          error: (err) => this.showErrorDialog('Creation Failed', err?.error?.message || 'Failed to create movie.')
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
      next: (updatedDto) => {
        const targetRole = (updatedDto?.role || newRole) as 'ADMIN' | 'ORGANIZER' | 'CUSTOMER';
        this.users.update((currentUsers) =>
          currentUsers.map((u) =>
            u.id === String(numId) ? { ...u, role: targetRole } : u
          )
        );
        this.syncOrganizersSignal();
      },
      error: (err) => this.showErrorDialog('Role Update Failed', err?.error?.message || 'Failed to update user role.'),
    });
  }

  deleteItem(item: any) {
    const tab = this.activeTab();
    const numId = Number(item.id);

    if (tab === 'USERS' || tab === 'ORGANIZERS') {
      if (item.email === this.currentUserEmail()) return;
      if (!numId) return;

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: `Delete ${tab === 'USERS' ? 'User' : 'Organizer'}`,
          message: `Are you sure you want to delete user "${item.name || item.email}"? This action cannot be undone.`,
          confirmText: 'Delete User',
          type: 'danger',
        },
      });

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.userService.deleteUser(numId).subscribe({
            next: () => this.loadAdminData(),
            error: (err) => this.showErrorDialog('Deletion Failed', err?.error?.message || 'Failed to delete user.'),
          });
        }
      });
    } else if (tab === 'VENUES') {
      if (!numId) return;

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Venue',
          message: `Are you sure you want to delete venue "${item.name}"? This action cannot be undone.`,
          confirmText: 'Delete Venue',
          type: 'danger',
        },
      });

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.venueService.deleteVenue(numId).subscribe({
            next: () => this.loadAdminData(),
            error: (err) => this.showErrorDialog('Deletion Failed', err?.error?.message || 'Failed to delete venue.'),
          });
        }
      });
    } else if (tab === 'MOVIES') {
      if (!numId) return;

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Movie',
          message: `Are you sure you want to delete movie "${item.title}"? This action cannot be undone.`,
          confirmText: 'Delete Movie',
          type: 'danger',
        },
      });

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.eventService.deleteEvent(numId).subscribe({
            next: () => this.loadAdminData(),
            error: (err) => this.showErrorDialog('Deletion Failed', err?.error?.message || 'Failed to delete event.'),
          });
        }
      });
    }
  }

  isCurrentUser(email: string): boolean {
    return email === this.currentUserEmail();
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

  private syncOrganizersSignal(): void {
    const mappedOrgs: OrganizerItem[] = this.users()
      .filter((u) => u.role === 'ORGANIZER')
      .map((u) => ({
        id: String(u.id),
        name: u.name || u.email,
        email: u.email,
        company: 'Event Organizer',
        joinedDate: u.joinedDate || '2026-08-01',
      }));
    this.organizers.set(mappedOrgs);
  }
}
