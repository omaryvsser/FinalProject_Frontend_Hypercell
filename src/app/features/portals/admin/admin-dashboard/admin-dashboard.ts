import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, required, email, min } from '@angular/forms/signals';
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

/**
 * Union type representing the currently active management tab in the Admin Dashboard.
 */
export type TabType = 'USERS' | 'ORGANIZERS' | 'VENUES' | 'MOVIES';

/**
 * UI representation of a User entity displayed in the users table.
 */
export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ORGANIZER' | 'CUSTOMER';
  joinedDate: string;
}

/**
 * UI representation of an Organizer entity displayed in the organizers table.
 */
export interface OrganizerItem {
  id: string;
  name: string;
  email: string;
  company: string;
  joinedDate: string;
}

/**
 * UI representation of a Venue entity displayed in the venues table.
 */
export interface VenueItem {
  id: string;
  name: string;
  address: string;
  capacity: number;
}

/**
 * UI representation of a Movie / Event entity displayed in the movies table.
 */
export interface MovieItem {
  id: string;
  title: string;
  genre: string;
  duration: string;
  rating: string;
  releaseDate: string;
}

/**
 * AdminDashboardComponent
 *
 * Core component for the Admin Portal. Handles server-side paginated management of:
 * - Users & Organizers
 * - Venues
 * - Movies / Events
 *
 * Provides functionality for adding, editing, updating roles, deleting items with confirmation,
 * slide-over drawer forms, and dynamic dashboard metrics.
 */
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
  // --- Injected Services & Utilities ---
  private readonly userService = inject(UserService);
  private readonly venueService = inject(VenueService);
  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  // --- Core State Signals ---
  /** Active tab selection ('USERS' | 'ORGANIZERS' | 'VENUES' | 'MOVIES') */
  activeTab = signal<TabType>('USERS');
  /** Current page index for pagination (1-based) */
  currentPage = signal<number>(1);
  /** Fixed page size sent to Spring Boot backend */
  readonly pageSize = signal<number>(5); // Strict hardcoded page size 5
  /** Total number of pages returned from the backend */
  totalServerPages = signal<number>(1);
  /** Total number of elements across all pages returned from the backend */
  totalServerElements = signal<number>(0);

  /** Drawer state: true if slide-over side drawer is visible */
  isDrawerOpen = signal<boolean>(false);
  /** Selected item object when editing an existing entry, null when creating new */
  selectedItem = signal<any | null>(null);

  /** Currently logged-in administrator's email address */
  currentUserEmail = signal<string>('');

  // --- Dynamic Backend Data Signals ---
  users = signal<UserItem[]>([]);
  organizers = signal<OrganizerItem[]>([]);
  venues = signal<VenueItem[]>([]);
  movies = signal<MovieItem[]>([]);
  /** Loading indicator state during API transactions */
  isLoading = signal<boolean>(false);

  // --- Slide-Over Drawer Signal Forms Models & Schemas ---
  // 1. User Signal Form
  readonly userModel = signal({
    name: '',
    email: '',
    role: 'CUSTOMER' as 'ADMIN' | 'ORGANIZER' | 'CUSTOMER',
  });
  readonly userForm = form(this.userModel, (schema) => {
    required(schema.name, { message: 'Full name is required' });
    required(schema.email, { message: 'Email address is required' });
    email(schema.email, { message: 'Please enter a valid email address' });
    required(schema.role, { message: 'Role is required' });
  });

  // 2. Organizer Signal Form
  readonly organizerModel = signal({
    name: '',
    email: '',
    company: '',
  });
  readonly organizerForm = form(this.organizerModel, (schema) => {
    required(schema.name, { message: 'Organizer contact name is required' });
    required(schema.email, { message: 'Contact email is required' });
    email(schema.email, { message: 'Please enter a valid email address' });
    required(schema.company, { message: 'Company is required' });
  });

  // 3. Venue Signal Form
  readonly venueModel = signal({
    name: '',
    address: '',
    capacity: 100,
  });
  readonly venueForm = form(this.venueModel, (schema) => {
    required(schema.name, { message: 'Venue name is required' });
    required(schema.address, { message: 'Street address is required' });
    required(schema.capacity, { message: 'Seat capacity is required' });
    min(schema.capacity, 10, { message: 'Capacity must be at least 10 seats' });
  });

  // 4. Movie Signal Form
  readonly movieModel = signal({
    title: '',
    description: '',
    imageUrl: '',
    genre: 'Action',
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED',
    director: '',
    durationMinutes: 120,
    language: 'English',
    startDate: '',
    endDate: '',
    venueId: 1,
  });
  readonly movieForm = form(this.movieModel, (schema) => {
    required(schema.title, { message: 'Movie title is required' });
    required(schema.genre, { message: 'Genre is required' });
    required(schema.startDate, { message: 'Start time is required' });
    required(schema.endDate, { message: 'End time is required' });
    required(schema.venueId, { message: 'Cinema is required' });
    min(schema.durationMinutes, 1, { message: 'Duration must be at least 1 minute' });
  });

  /**
   * Component Lifecycle Initialization
   * Retrieves logged-in admin email and fetches initial page data.
   */
  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user && user.email) {
      this.currentUserEmail.set(user.email);
    }
    this.loadAdminData(1);
  }

  /**
   * Fetches page-by-page server-side paginated data from REST API Endpoints (page size = 5).
   * Maps backend entities into UI interfaces for Users, Organizers, Venues, or Movies.
   *
   */
  loadAdminData(page: number = this.currentPage()): void {
    this.isLoading.set(true);
    const currentTab = this.activeTab();

    if (currentTab === 'USERS' || currentTab === 'ORGANIZERS') {
      // Fetch users with pagination
      this.userService.getPaginatedUsers(page, 5).subscribe({
        next: (res: PaginatedResponse<UserDto>) => {
          // Map users DTO array to UI UserItem format
          const mappedUsers: UserItem[] = (res.content || []).map((u) => ({
            id: String(u.id),
            name: u.name || u.email,
            email: u.email,
            role: (u.role || 'CUSTOMER') as 'ADMIN' | 'ORGANIZER' | 'CUSTOMER',
            joinedDate: '2026-08-01',
          }));
          this.users.set(mappedUsers);

          // Extract organizers subset for the Organizers view
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

          // Update server pagination metrics
          this.totalServerPages.set(res.totalPages || 1);
          this.totalServerElements.set(res.totalElements || 0);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    } else if (currentTab === 'VENUES') {
      // Fetch venues with pagination
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
      // Fetch movies/events with pagination
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

  // --- Computed Metrics & Dashboard Summaries ---
  /** Count of users on current page */
  totalUsersCount = computed(() => this.users().length);
  /** Count of active organizers on current page */
  activeOrganizersCount = computed(() => this.organizers().length);
  /** Count of registered venues on current page */
  registeredVenuesCount = computed(() => this.venues().length);
  /** Count of movies on current page */
  totalMoviesCount = computed(() => this.movies().length);

  /** Total elements count returned by server or fallback to local user count */
  totalItems = computed(() => this.totalServerElements() || this.totalUsersCount());
  /** Total pagination pages count guaranteed to be at least 1 */
  totalPages = computed(() => Math.max(1, this.totalServerPages()));

  // Server-side paginated content accessors for child table component
  paginatedUsers = computed(() => this.users());
  paginatedOrganizers = computed(() => this.organizers());
  paginatedVenues = computed(() => this.venues());
  paginatedMovies = computed(() => this.movies());

  /** Generates an array of page numbers [1, 2, ..., totalPages] for UI pagination buttons */
  pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  /** Returns singular entity label for display in UI drawer titles */
  singularTabLabel = computed(() => {
    switch (this.activeTab()) {
      case 'USERS': return 'User';
      case 'ORGANIZERS': return 'Organizer';
      case 'VENUES': return 'Venue';
      case 'MOVIES': return 'Movie';
    }
  });

  // --- User Interface Actions & Handlers ---

  /**
   * Switches the active management tab and reloads first page data.
   *
   */
  setActiveTab(tab: TabType) {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadAdminData(1);
  }

  /**
   * Navigates to a specific pagination page if within valid range.
   *
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadAdminData(page);
    }
  }

  /**
   * Opens the slide-over drawer in "Create / Add New Item" mode.
   * Resets all form fields to default values.
   */
  openAddDrawer() {
    this.selectedItem.set(null);
    this.resetFormFields();
    this.isDrawerOpen.set(true);
  }

  /**
   * Opens the slide-over drawer in "Edit Item" mode.
   * Populates form fields with existing properties of the selected item.
   *
   */
  openEditDrawer(item: any) {
    this.selectedItem.set(item);
    this.populateFormFields(item);
    this.isDrawerOpen.set(true);
  }

  /**
   * Closes the slide-over side drawer and clears selected item state.
   */
  closeDrawer() {
    this.isDrawerOpen.set(false);
    this.selectedItem.set(null);
  }

  /**
   * Resets all drawer form input signals to their default initial values.
   */
  resetFormFields() {
    this.userModel.set({
      name: '',
      email: '',
      role: 'CUSTOMER',
    });
    this.organizerModel.set({
      name: '',
      email: '',
      company: '',
    });
    this.venueModel.set({
      name: '',
      address: '',
      capacity: 100,
    });
    const firstVenue = this.venues().length > 0 ? Number(this.venues()[0].id) : 1;
    this.movieModel.set({
      title: '',
      description: '',
      imageUrl: '',
      genre: 'Action',
      status: 'PUBLISHED',
      director: '',
      durationMinutes: 120,
      language: 'English',
      startDate: '',
      endDate: '',
      venueId: firstVenue,
    });
  }

  /**
   * Populates drawer form input signals with values from the given item based on active tab.
   *
   */
  populateFormFields(item: any) {
    switch (this.activeTab()) {
      case 'USERS':
        this.userModel.set({
          name: item.name || '',
          email: item.email || '',
          role: item.role || 'CUSTOMER',
        });
        break;
      case 'ORGANIZERS':
        this.organizerModel.set({
          name: item.name || '',
          email: item.email || '',
          company: item.company || '',
        });
        break;
      case 'VENUES':
        this.venueModel.set({
          name: item.name || '',
          address: item.address || '',
          capacity: item.capacity || 100,
        });
        break;
      case 'MOVIES':
        this.movieModel.set({
          title: item.title || '',
          description: item.description || '',
          imageUrl: item.imageUrl || '',
          genre: item.genre || 'Action',
          status: item.status || 'PUBLISHED',
          director: item.director || '',
          durationMinutes: Number(item.durationMinutes || item.duration || 120),
          language: item.language || 'English',
          startDate: item.startDate || '',
          endDate: item.endDate || '',
          venueId: item.venueId ? Number(item.venueId) : (this.venues().length > 0 ? Number(this.venues()[0].id) : 1),
        });
        break;
    }
  }

  /**
   * Handles saving (Create or Update) of items in the slide-over side drawer.
   * Sends appropriate payloads to VenueService, UserService, or EventService depending on activeTab.
   */
  saveDrawerItem() {
    const selected = this.selectedItem();
    const tab = this.activeTab();

    if (tab === 'VENUES') {
      this.venueForm().markAsTouched();
      if (this.venueForm().invalid()) {
        return;
      }
      const val = this.venueModel();
      const payload = {
        name: val.name.trim(),
        address: val.address.trim(),
        capacity: Number(val.capacity),
      };
      if (selected && selected.id) {
        // Update existing venue
        this.venueService.updateVenue(Number(selected.id), payload).subscribe({
          next: () => {
            this.loadAdminData();
            this.closeDrawer();
          },
          error: (err) => this.showErrorDialog('Update Failed', err?.error?.message || 'Failed to update venue.')
        });
      } else {
        // Create new venue
        this.venueService.createVenue(payload).subscribe({
          next: () => {
            this.loadAdminData();
            this.closeDrawer();
          },
          error: (err) => this.showErrorDialog('Creation Failed', err?.error?.message || 'Failed to create venue.')
        });
      }
    } else if (tab === 'USERS') {
      this.userForm().markAsTouched();
      if (this.userForm().invalid()) {
        return;
      }
      if (selected && selected.id) {
        // Update user role
        const targetRoleId = Number(selected.id);
        const requestedRole = this.userModel().role as UserRole;
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
    } else if (tab === 'ORGANIZERS') {
      this.organizerForm().markAsTouched();
      if (this.organizerForm().invalid()) {
        return;
      }
      this.closeDrawer();
    } else if (tab === 'MOVIES') {
      this.movieForm().markAsTouched();
      if (this.movieForm().invalid()) {
        return;
      }
      const val = this.movieModel();
      const sDate = val.startDate;
      const eDate = val.endDate;

      let imgUrl = val.imageUrl.trim();
      if (!imgUrl) {
        imgUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba';
      }

      const payload = {
        title: val.title.trim(),
        description: val.description ? val.description.trim() : '',
        category: val.genre || 'Action',
        startDate: sDate ? (sDate.length === 16 ? `${sDate}:00` : sDate) : '2026-08-25T20:00:00',
        endDate: eDate ? (eDate.length === 16 ? `${eDate}:00` : eDate) : '2026-08-25T22:00:00',
        status: val.status || 'PUBLISHED',
        venueId: Number(val.venueId) || 1,
        director: val.director ? val.director.trim() : undefined,
        durationMinutes: Number(val.durationMinutes) || 120,
        language: val.language ? val.language.trim() : undefined,
        imageUrl: imgUrl
      };

      if (selected && selected.id) {
        // Update existing movie event
        this.eventService.updateEvent(Number(selected.id), payload).subscribe({
          next: () => {
            this.loadAdminData();
            this.closeDrawer();
          },
          error: (err) => this.showErrorDialog('Update Failed', err?.error?.message || 'Failed to update movie.')
        });
      } else {
        // Create new movie event
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


  /**
   * Directly updates a specific user's role (ADMIN, ORGANIZER, CUSTOMER).
   * Prevents self-role modifications for the currently logged-in administrator.
   */
  updateUserRole(user: UserItem, newRole: 'ADMIN' | 'CUSTOMER' | 'ORGANIZER') {
    // Prevent logged in admin from changing their own role
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

  /**
   * Prompts for user confirmation via modal dialog and deletes the specified item (User, Venue, or Movie).
   * Prevents deleting the current administrator.
   *
   */
  deleteItem(item: any) {
    const tab = this.activeTab();
    const numId = Number(item.id);

    if (tab === 'USERS' || tab === 'ORGANIZERS') {
      // Safety check: prohibit self-deletion
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

  /**
   * Helper function checking whether an email belongs to the currently logged-in admin user.
   */
  isCurrentUser(email: string): boolean {
    return email === this.currentUserEmail();
  }

  /**
   * Displays warning dialog modal when backend operations encounter an error.
   */
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

  /**
   * Synchronizes the `organizers` signal list from current `users` signal whenever user roles change.
   */
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

