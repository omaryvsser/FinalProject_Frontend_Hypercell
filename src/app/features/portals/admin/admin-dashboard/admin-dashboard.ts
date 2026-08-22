import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { form, required, email, min } from '@angular/forms/signals';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminHeaderComponent } from './components/admin-header/admin-header';
import { MetricCardsComponent } from './components/metric-cards/metric-cards';
import { AdminTabsComponent } from './components/admin-tabs/admin-tabs';
import { AdminTableComponent, TableColumn, TableAction } from '../../../../shared/components/admin-table/admin-table';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer';
import { ADMIN_DRAWER_CONFIG } from './config/admin-drawer.config';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { UserService } from '../../../../core/services/user.service';
import { VenueService } from '../../../../core/services/venue.service';
import { EventService } from '../../../../core/services/event.service';
import { BookingService } from '../../../../core/services/booking.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserDto, UserRole } from '../../../../core/models/user.model';
import { EventResponse } from '../../../../core/models/event.model';
import { BookingResponse } from '../../../../core/models/booking.model';
import { PaginatedResponse } from '../../../../core/models/pagination.model';
import { UserFormModel } from './components/forms/user-form/user-form';
import { OrganizerFormModel } from './components/forms/organizer-form/organizer-form';
import { VenueFormModel } from './components/forms/venue-form/venue-form';
import { MovieFormModel, SeatCategoryInput } from './components/forms/movie-form/movie-form';

/**
 * Union type representing the currently active management tab in the Admin Dashboard.
 */
export type TabType = 'USERS' | 'ORGANIZERS' | 'VENUES' | 'MOVIES' | 'BOOKINGS';

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
 * UI representation of a Booking entity displayed in the bookings table.
 */
export interface BookingItem {
  id: string;
  bookingId: number;
  customerName: string;
  customerEmail: string;
  organizerName: string;
  eventTitle: string;
  seatCategoryName: string;
  quantity: number;
  totalPrice: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  createdAt: string;
}

/**
 * AdminDashboardComponent
 *
 * Core component for the Admin Portal. Handles server-side paginated management of:
 * - Users & Organizers
 * - Venues
 * - Movies / Events
 * - Bookings
 *
 * Provides functionality for adding, editing, updating roles, deleting items with confirmation,
 * dynamic drawer configuration maps, and dynamic dashboard metrics.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    MatDialogModule,
    AdminHeaderComponent,
    MetricCardsComponent,
    AdminTabsComponent,
    AdminTableComponent,
    DrawerComponent,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardComponent implements OnInit {
  // --- Injected Services & Utilities ---
  private readonly userService = inject(UserService);
  private readonly venueService = inject(VenueService);
  private readonly eventService = inject(EventService);
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);

  private readonly dialog = inject(MatDialog);

  // --- Core State Signals ---
  /** Active tab selection ('USERS' | 'ORGANIZERS' | 'VENUES' | 'MOVIES' | 'BOOKINGS') */
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

  // --- Total Count Signals across Entire Backend Datasets ---
  totalUsersCount = signal<number>(0);
  totalOrganizersCount = signal<number>(0);
  totalVenuesCount = signal<number>(0);
  totalMoviesCount = signal<number>(0);
  totalBookingsCount = signal<number>(0);

  // --- Dynamic Backend Data Signals ---
  users = signal<UserItem[]>([]);
  organizers = signal<OrganizerItem[]>([]);
  venues = signal<VenueItem[]>([]);
  movies = signal<MovieItem[]>([]);
  bookings = signal<BookingItem[]>([]);
  /** Loading indicator state during API transactions */
  isLoading = signal<boolean>(false);

  // --- Reusable DataTable Column Definitions ---
  readonly userColumns: TableColumn<UserItem>[] = [
    { key: 'name', header: 'Name', type: 'user' },
    { key: 'email', header: 'Email Address' },
    { key: 'role', header: 'Role', type: 'roleSelect' },
    { key: 'joinedDate', header: 'Joined Date' },
  ];

  readonly organizerColumns: TableColumn<OrganizerItem>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email Address' },
    { key: 'company', header: 'Company / Organization', type: 'badge' },
    { key: 'joinedDate', header: 'Joined Date' },
  ];

  readonly venueColumns: TableColumn<VenueItem>[] = [
    { key: 'name', header: 'Venue Name' },
    { key: 'address', header: 'Address' },
    { key: 'capacity', header: 'Total Capacity', type: 'capacity' },
  ];

  readonly movieColumns: TableColumn<MovieItem>[] = [
    { key: 'title', header: 'Movie Title' },
    { key: 'genre', header: 'Genre', type: 'badge' },
    { key: 'duration', header: 'Duration' },
    { key: 'rating', header: 'Age Rating', type: 'rating' },
    { key: 'releaseDate', header: 'Release Date' },
  ];

  readonly bookingColumns: TableColumn<BookingItem>[] = [
    { key: 'bookingId', header: 'Booking #', format: (val) => `#${val}` },
    { key: 'customerName', header: 'Customer / Attendee', type: 'attendee' },
    { key: 'eventTitle', header: 'Movie Title' },
    { key: 'organizerName', header: 'Organizer' },
    { key: 'seatCategoryName', header: 'Seat Tier', type: 'badge' },
    { key: 'quantity', header: 'Tickets' },
    { key: 'totalPrice', header: 'Total', type: 'currency' },
    { key: 'status', header: 'Status', type: 'bookingStatusSelect' },
    { key: 'createdAt', header: 'Booked Date', type: 'date' },
  ];

  readonly tableColumns = computed<TableColumn[]>(() => {
    switch (this.activeTab()) {
      case 'USERS': return this.userColumns;
      case 'ORGANIZERS': return this.organizerColumns;
      case 'VENUES': return this.venueColumns;
      case 'MOVIES': return this.movieColumns;
      case 'BOOKINGS': return this.bookingColumns;
    }
  });

  readonly tableActions = computed<TableAction[]>(() => {
    const tab = this.activeTab();
    if (tab === 'BOOKINGS') {
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
    return [
      {
        id: 'edit',
        label: `Edit ${this.singularTabLabel().toLowerCase()}`,
        icon: 'edit',
        cssClass: 'edit',
      },
      {
        id: 'delete',
        label: `Delete ${this.singularTabLabel().toLowerCase()}`,
        icon: 'delete',
        cssClass: 'delete',
        disabled: (row: any) => tab === 'USERS' && this.isCurrentUser(row.email),
      },
    ];
  });

  readonly currentTableData = computed<any[]>(() => {
    switch (this.activeTab()) {
      case 'USERS': return this.users();
      case 'ORGANIZERS': return this.organizers();
      case 'VENUES': return this.venues();
      case 'MOVIES': return this.movies();
      case 'BOOKINGS': return this.bookings();
    }
  });

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
  readonly movieModel = signal<MovieFormModel>({
    title: '',
    description: '',
    imageUrl: '',
    category: 'Action',
    status: 'PUBLISHED',
    director: '',
    durationMinutes: 120,
    language: 'English',
    startDate: '',
    endDate: '',
    venueId: 1,
  });
  readonly movieForm = form(this.movieModel, (schema) => {
    required(schema.title, { message: 'Movie title is required' });
    required(schema.category, { message: 'Genre is required' });
    required(schema.startDate, { message: 'Start time is required' });
    required(schema.endDate, { message: 'End time is required' });
    required(schema.venueId, { message: 'Cinema is required' });
    min(schema.durationMinutes, 1, { message: 'Duration must be at least 1 minute' });
  });

  readonly seatCategories = signal<SeatCategoryInput[]>([
    { name: 'STANDARD', price: 100, totalSeats: 50 },
    { name: 'VIP', price: 150, totalSeats: 20 },
    { name: 'IMAX', price: 200, totalSeats: 20 },
  ]);


  /**
   * Component Lifecycle Initialization
   * Retrieves logged-in admin email, loads total counts, and fetches initial page data.
   */
  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user && user.email) {
      this.currentUserEmail.set(user.email);
    }
    this.loadAllTotals();
    this.loadAdminData(1);
  }

  /**
   * Fetches full backend dataset totals for all 4 entity types for tab counters and metric cards.
   */
  loadAllTotals(): void {
    this.userService.getAllUsers().subscribe({
      next: (userList) => {
        const list = userList || [];
        this.totalUsersCount.set(list.length);
        this.totalOrganizersCount.set(list.filter((u) => u.role === 'ORGANIZER').length);
      },
      error: () => {},
    });

    this.venueService.getPaginatedVenues(1, 1).subscribe({
      next: (res) => {
        this.totalVenuesCount.set(res.totalElements || (res.content?.length ?? 0));
      },
      error: () => {},
    });

    this.venueService.getVenues().subscribe({
      next: (venueList) => {
        if (this.venues().length === 0 && venueList?.length) {
          this.venues.set(venueList.map(v => ({
            id: String(v.id),
            name: v.name,
            address: v.address || 'Cairo, Egypt',
            capacity: v.capacity || 500,
          })));
        }
      },
      error: () => {},
    });

    this.eventService.getOrganizerEvents(1, 1).subscribe({
      next: (res) => {
        this.totalMoviesCount.set(res.totalElements || (res.content?.length ?? 0));
      },
      error: () => {},
    });

    this.bookingService.getPaginatedBookings(1, 1).subscribe({
      next: (res) => {
        this.totalBookingsCount.set(res.totalElements || (res.content?.length ?? 0));
      },
      error: () => {},
    });
  }

  /**
   * Fetches page-by-page server-side paginated data from REST API Endpoints (page size = 5).

   * Maps backend entities into UI interfaces for Users, Organizers, Venues, Movies, or Bookings.
   */
  loadAdminData(page: number = this.currentPage()): void {
    this.isLoading.set(true);
    const currentTab = this.activeTab();

    if (currentTab === 'USERS' || currentTab === 'ORGANIZERS') {
      // Fetch users with pagination
      this.userService.getPaginatedUsers(page, this.pageSize()).subscribe({
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

          // Update server pagination metrics and total count
          this.totalServerPages.set(res.totalPages || 1);
          this.totalServerElements.set(res.totalElements || mappedUsers.length);
          if (currentTab === 'USERS' && res.totalElements != null) {
            this.totalUsersCount.set(res.totalElements);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    } else if (currentTab === 'VENUES') {
      // Fetch venues with pagination
      this.venueService.getPaginatedVenues(page, this.pageSize()).subscribe({
        next: (res) => {
          const mappedVenues: VenueItem[] = (res.content || []).map((v) => ({
            id: String(v.id),
            name: v.name,
            address: v.address || 'Cairo, Egypt',
            capacity: v.capacity || 500,
          }));
          this.venues.set(mappedVenues);
          this.totalServerPages.set(res.totalPages || 1);
          this.totalServerElements.set(res.totalElements || mappedVenues.length);
          if (res.totalElements != null) {
            this.totalVenuesCount.set(res.totalElements);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    } else if (currentTab === 'MOVIES') {
      // Fetch movies/events with pagination
      this.eventService.getOrganizerEvents(page, this.pageSize()).subscribe({
        next: (res: PaginatedResponse<EventResponse>) => {
          const eventList: EventResponse[] = res.content || [];
          const mappedMovies: MovieItem[] = eventList.map((e: any) => ({
            ...e,
            id: String(e.id),
            title: e.title,
            genre: e.category || 'General',
            category: e.category || 'General',
            duration: e.durationMinutes ? `${e.durationMinutes} min` : '120 min',
            durationMinutes: e.durationMinutes || 120,
            rating: 'PG-13',
            releaseDate: e.startDate ? e.startDate.split('T')[0] : '2026-08-01',
            startDate: e.startDate || '',
            endDate: e.endDate || e.startDate || '',
            description: e.description || '',
            imageUrl: e.imageUrl || '',
            director: e.director || '',
            language: e.language || 'English',
            venueName: e.venueName || '',
            venueId: e.venueId || e.venue?.id,
            status: e.status || 'PUBLISHED',
          }));
          this.movies.set(mappedMovies);
          this.totalServerPages.set(res.totalPages || 1);
          this.totalServerElements.set(res.totalElements ?? mappedMovies.length);
          if (res.totalElements != null) {
            this.totalMoviesCount.set(res.totalElements);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    } else if (currentTab === 'BOOKINGS') {
      // Fetch bookings with pagination
      this.bookingService.getPaginatedBookings(page, this.pageSize()).subscribe({
        next: (res: PaginatedResponse<BookingResponse>) => {
          const mappedBookings: BookingItem[] = (res.content || []).map((b) => ({
            id: String(b.bookingId),
            bookingId: b.bookingId,
            customerName: b.customerName || 'Customer',
            customerEmail: b.customerEmail || 'customer@cinema.eg',
            organizerName: b.organizerName || 'Organizer',
            eventTitle: b.eventTitle,
            seatCategoryName: b.seatCategoryName || 'STANDARD',
            quantity: b.quantity,
            totalPrice: b.totalPrice,
            status: b.status as any,
            createdAt: b.createdAt,
          }));
          this.bookings.set(mappedBookings);
          this.totalServerPages.set(res.totalPages || 1);
          this.totalServerElements.set(res.totalElements || mappedBookings.length);
          if (res.totalElements != null) {
            this.totalBookingsCount.set(res.totalElements);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  /** Total elements count returned by server or fallback to tab totals */
  totalItems = computed(() => {
    switch (this.activeTab()) {
      case 'USERS': return this.totalUsersCount();
      case 'ORGANIZERS': return this.totalOrganizersCount();
      case 'VENUES': return this.totalVenuesCount();
      case 'MOVIES': return this.totalMoviesCount();
      case 'BOOKINGS': return this.totalBookingsCount();
    }
  });

  /** Total pagination pages count guaranteed to be at least 1 */
  totalPages = computed(() => {
    if (this.totalServerPages() > 0) {
      return this.totalServerPages();
    }
    const total = this.totalItems();
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  // Server-side paginated content accessors
  paginatedUsers = computed(() => this.users());
  paginatedOrganizers = computed(() => this.organizers());
  paginatedVenues = computed(() => this.venues());
  paginatedMovies = computed(() => this.movies());
  paginatedBookings = computed(() => this.bookings());

  /** Generates an array of page numbers [1, 2, ..., totalPages] for UI pagination buttons */
  pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });


  /** Returns singular entity label for display in UI drawer titles */
  readonly singularTabLabel = computed(() => {
    switch (this.activeTab()) {
      case 'USERS': return 'User';
      case 'ORGANIZERS': return 'Organizer';
      case 'VENUES': return 'Venue';
      case 'MOVIES': return 'Movie';
      case 'BOOKINGS': return 'Booking';
    }
  });


  readonly activeDrawerConfig = computed(() => {
    const tab = this.activeTab();
    const config = ADMIN_DRAWER_CONFIG[tab];
    if (!config) return null;
    const isEdit = !!this.selectedItem();
    const label = this.singularTabLabel();
    return {
      component: config.component,
      wide: config.wide ?? false,
      title: config.title(isEdit, label),
      subtitle: config.subtitle(isEdit, label),
      submitLabel: config.submitLabel(isEdit, label),
      inputs: config.getInputs(this),
    };
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
      category: 'Action',
      status: 'PUBLISHED',
      director: '',
      durationMinutes: 120,
      language: 'English',
      startDate: '',
      endDate: '',
      venueId: firstVenue,
    });
    this.seatCategories.set([
      { name: 'STANDARD', price: 100, totalSeats: 50 },
      { name: 'VIP', price: 150, totalSeats: 20 },
      { name: 'IMAX', price: 200, totalSeats: 20 },
    ]);
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
          category: item.category || item.genre || 'Action',
          status: item.status || 'PUBLISHED',
          director: item.director || '',
          durationMinutes: Number(item.durationMinutes || item.duration || 120),
          language: item.language || 'English',
          startDate: item.startDate || '',
          endDate: item.endDate || '',
          venueId: item.venueId ? Number(item.venueId) : (this.venues().length > 0 ? Number(this.venues()[0].id) : 1),
        });

        if (item.id) {
          this.eventService.getSeatCategories(Number(item.id)).subscribe({
            next: (cats) => {
              if (cats && cats.length > 0) {
                const mappedCategories: SeatCategoryInput[] = cats.map((c) => ({
                  name: c.name as any,
                  price: c.price,
                  totalSeats: c.totalSeats,
                }));
                this.seatCategories.set(mappedCategories);
              } else {
                this.seatCategories.set([
                  { name: 'STANDARD', price: 100, totalSeats: 50 },
                  { name: 'VIP', price: 150, totalSeats: 20 },
                  { name: 'IMAX', price: 200, totalSeats: 20 },
                ]);
              }
            },
            error: () => {
              this.seatCategories.set([
                { name: 'STANDARD', price: 100, totalSeats: 50 },
                { name: 'VIP', price: 150, totalSeats: 20 },
                { name: 'IMAX', price: 200, totalSeats: 20 },
              ]);
            },
          });
        } else {
          this.seatCategories.set([
            { name: 'STANDARD', price: 100, totalSeats: 50 },
            { name: 'VIP', price: 150, totalSeats: 20 },
            { name: 'IMAX', price: 200, totalSeats: 20 },
          ]);
        }
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
            this.loadAllTotals();
            this.loadAdminData();
            this.closeDrawer();
          },
          error: (err) => this.showErrorDialog('Update Failed', err?.error?.message || 'Failed to update venue.')
        });
      } else {
        // Create new venue
        this.venueService.createVenue(payload).subscribe({
          next: () => {
            this.loadAllTotals();
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
            this.loadAllTotals();
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

      const seatCategoriesPayload = this.seatCategories()
        .filter((cat) => cat.name && cat.price !== null && cat.totalSeats !== null)
        .map((cat) => ({
          name: cat.name,
          price: Number(cat.price),
          totalSeats: Number(cat.totalSeats),
        }));

      const payload = {
        title: val.title.trim(),
        description: val.description ? val.description.trim() : '',
        category: val.category || 'Action',
        startDate: sDate ? (sDate.length === 16 ? `${sDate}:00` : sDate) : '2026-08-25T20:00:00',
        endDate: eDate ? (eDate.length === 16 ? `${eDate}:00` : eDate) : '2026-08-25T22:00:00',
        status: val.status || 'PUBLISHED',
        venueId: Number(val.venueId) || 1,
        director: val.director ? val.director.trim() : undefined,
        durationMinutes: Number(val.durationMinutes) || 120,
        language: val.language ? val.language.trim() : undefined,
        imageUrl: imgUrl,
        seatCategories: seatCategoriesPayload.length > 0 ? seatCategoriesPayload : undefined,
      };

      if (selected && selected.id) {
        // Update existing movie event
        this.eventService.updateEvent(Number(selected.id), payload).subscribe({
          next: () => {
            this.loadAllTotals();
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
            this.loadAllTotals();
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
  updateUserRole(user: UserItem, newRole: 'ADMIN' | 'CUSTOMER' | 'ORGANIZER' | string) {

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
        this.loadAllTotals();
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
            next: () => {
              this.loadAllTotals();
              this.loadAdminData();
            },
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
            next: () => {
              this.loadAllTotals();
              this.loadAdminData();
            },
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
            next: () => {
              this.loadAllTotals();
              this.loadAdminData();
            },
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
   * Dispatches action clicks (such as Cancel Booking) from the reusable table.
   */
  handleTableAction(event: { action: string; row: any }): void {
    if (event.action === 'cancel') {
      this.cancelBooking(event.row);
    }
  }

  /**
   * Prompts confirmation and invokes backend cancellation for a booking.
   */
  cancelBooking(booking: BookingItem): void {
    if (!booking || booking.status === 'CANCELLED') return;
    const numId = Number(booking.bookingId || booking.id);
    if (!numId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Booking?',
        message: `Are you sure you want to cancel booking #${booking.bookingId} for ${booking.customerName}? Reserved seat capacity will be restored.`,
        confirmText: 'Cancel Booking',
        cancelText: 'Keep Booking',
        type: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.bookingService.cancelBooking(numId).subscribe({
          next: () => {
            this.loadAdminData();
            this.loadAllTotals();
          },
          error: (err) => {
            this.showErrorDialog('Cancellation Failed', err?.error?.message || 'Failed to cancel booking.');
          },
        });
      }
    });
  }

  /**
   * Updates status of a booking with confirmation if transitioning to CANCELLED.
   */
  updateBookingStatus(booking: BookingItem, newStatus: string): void {
    if (!booking || !newStatus || booking.status === newStatus) return;

    if (booking.status === 'CANCELLED') {
      this.showErrorDialog('Invalid Action', 'Cancelled bookings cannot be reactivated.');
      return;
    }

    if (newStatus === 'CANCELLED') {
      this.cancelBooking(booking);
      return;
    }

    const numId = Number(booking.bookingId || booking.id);
    if (!numId) return;

    this.bookingService.updateBookingStatus(numId, newStatus as any).subscribe({
      next: () => {
        this.loadAdminData();
      },
      error: (err) => {
        this.showErrorDialog('Status Update Failed', err?.error?.message || 'Failed to update booking status.');
        this.loadAdminData();
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

