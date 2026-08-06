import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminHeaderComponent } from './components/admin-header/admin-header';
import { MetricCardsComponent } from './components/metric-cards/metric-cards';
import { AdminTabsComponent } from './components/admin-tabs/admin-tabs';
import { DynamicTableComponent } from './components/dynamic-table/dynamic-table';
import { SlideOverDrawerComponent } from './components/slide-over-drawer/slide-over-drawer';

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
export class AdminDashboardComponent {
  // --- Core State Signals ---
  activeTab = signal<TabType>('USERS');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);
  isDrawerOpen = signal<boolean>(false);
  selectedItem = signal<any | null>(null);

  // Mock logged-in Admin email to test safeguards
  currentUserEmail = signal<string>('admin@cinema.com');

  // --- Mock Data Signals (Initialized with 8-10 items each) ---
  users = signal<UserItem[]>([
    { id: 'usr-1', name: 'Omar Yasser (Admin)', email: 'admin@cinema.com', role: 'ADMIN', joinedDate: '2024-01-15' },
    { id: 'usr-2', name: 'Ahmed El-Sayed', email: 'ahmed.sayed@cinema.eg', role: 'CUSTOMER', joinedDate: '2024-02-01' },
    { id: 'usr-3', name: 'Mohamed Hassan', email: 'mhassan@eventos.eg', role: 'ORGANIZER', joinedDate: '2024-02-12' },
    { id: 'usr-4', name: 'Nour El-Din Sherif', email: 'nour.sherif@cinemaverse.eg', role: 'ORGANIZER', joinedDate: '2024-03-05' },
    { id: 'usr-5', name: 'Tarek Mansour', email: 'tarek.m@vance.eg', role: 'CUSTOMER', joinedDate: '2024-03-18' },
    { id: 'usr-6', name: 'Salma Abdelrahman', email: 'salma.a@mail.eg', role: 'CUSTOMER', joinedDate: '2024-04-02' },
    { id: 'usr-7', name: 'Youssef Ibrahim', email: 'yibrahim@luxe.eg', role: 'ORGANIZER', joinedDate: '2024-04-20' },
    { id: 'usr-8', name: 'Mariam Kamel', email: 'm.kamel@filmhub.eg', role: 'CUSTOMER', joinedDate: '2024-05-11' },
    { id: 'usr-9', name: 'Kareem Zaki', email: 'kareem.z@tech.eg', role: 'CUSTOMER', joinedDate: '2024-06-01' },
  ]);

  organizers = signal<OrganizerItem[]>([
    { id: 'org-1', name: 'Cairo Film Festival Co.', email: 'contact@ciff.eg', company: 'CIFF Foundation', joinedDate: '2024-01-10' },
    { id: 'org-2', name: 'El Gouna Media Group', email: 'info@elgounafilm.eg', company: 'Orascom Media', joinedDate: '2024-01-22' },
    { id: 'org-3', name: 'Alexandria Arts & Culture', email: 'ops@alexcinemas.eg', company: 'Alex Cultural Society', joinedDate: '2024-02-15' },
    { id: 'org-4', name: 'Pyramids Live Studios', email: 'support@pyramidsevents.eg', company: 'Pyramids Entertainment', joinedDate: '2024-03-01' },
    { id: 'org-5', name: 'Zawya Cinema Productions', email: 'admin@zawyacinema.eg', company: 'Misr International Films', joinedDate: '2024-03-25' },
    { id: 'org-6', name: 'Nile Stage & Screen', email: 'contact@nilestage.eg', company: 'Nile Arts Group', joinedDate: '2024-04-14' },
    { id: 'org-7', name: 'Pharaohs Visual Media', email: 'hello@pharaohsmedia.eg', company: 'Pharaohs Creative', joinedDate: '2024-05-03' },
    { id: 'org-8', name: 'Zamalek Culture Club', email: 'booking@zamalekevents.eg', company: 'Zamalek Nightlife', joinedDate: '2024-05-29' },
  ]);

  venues = signal<VenueItem[]>([
    { id: 'ven-1', name: 'Vox Cinema Mall of Egypt', address: 'Wahhat Rd, 6th of October City, Giza', capacity: 450 },
    { id: 'ven-2', name: 'Sea Cinema El Gouna', address: 'Abu Tig Marina, El Gouna, Red Sea', capacity: 220 },
    { id: 'ven-3', name: 'Cairo Opera House Main Hall', address: 'El-Borg Gezira St, Zamalek, Cairo', capacity: 850 },
    { id: 'ven-4', name: 'Renaissance Cinema Downtown', address: 'Emad El-Din St, Downtown, Cairo', capacity: 310 },
    { id: 'ven-5', name: 'San Stefano Grand Cinema', address: 'El-Geish Rd, San Stefano, Alexandria', capacity: 180 },
    { id: 'ven-6', name: 'Zawya Cinema Downtown', address: '15 Emad El-Din St, Downtown, Cairo', capacity: 600 },
    { id: 'ven-7', name: 'Galaxy Cinema El Manial', address: 'Abdulaziz Al Saud St, El Manial, Cairo', capacity: 500 },
    { id: 'ven-8', name: 'Sun City Cinema Heliopolis', address: 'Autostrad Rd, Heliopolis, Cairo', capacity: 150 },
  ]);

  movies = signal<MovieItem[]>([
    { id: 'mov-1', title: 'Kira & El Gin', genre: 'Action / Drama', duration: '175 min', rating: '15+', releaseDate: '2022-06-30' },
    { id: 'mov-2', title: 'The Blue Elephant 2', genre: 'Horror / Mystery', duration: '130 min', rating: '18+', releaseDate: '2019-07-25' },
    { id: 'mov-3', title: 'Voy! Voy! Voy!', genre: 'Comedy / Drama', duration: '108 min', rating: '12+', releaseDate: '2023-09-13' },
    { id: 'mov-4', title: 'El Emeleyyah Maziq', genre: 'Action / Comedy', duration: '115 min', rating: 'PG-13', releaseDate: '2024-01-04' },
    { id: 'mov-5', title: 'El Arif (The Knower)', genre: 'Action / Thriller', duration: '125 min', rating: '15+', releaseDate: '2021-07-14' },
    { id: 'mov-6', title: 'Welad Rizk 3: El Qadia', genre: 'Action / Crime', duration: '135 min', rating: '15+', releaseDate: '2024-06-12' },
    { id: 'mov-7', title: 'Abou El Nasab', genre: 'Comedy / Action', duration: '110 min', rating: 'PG-13', releaseDate: '2023-12-21' },
    { id: 'mov-8', title: 'El Geness (The Species)', genre: 'Sci-Fi / Drama', duration: '120 min', rating: 'PG-13', releaseDate: '2024-05-10' },
  ]);

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
    const today = new Date().toISOString().split('T')[0];

    if (tab === 'USERS') {
      if (selected) {
        this.users.update((list) =>
          list.map((u) =>
            u.id === selected.id
              ? {
                  ...u,
                  name: this.formName(),
                  email: this.formEmail(),
                  role: this.formRole(),
                }
              : u
          )
        );
      } else {
        const newUser: UserItem = {
          id: 'usr-' + Date.now(),
          name: this.formName() || 'New User',
          email: this.formEmail() || 'user@cinema.com',
          role: this.formRole(),
          joinedDate: today,
        };
        this.users.update((list) => [newUser, ...list]);
      }
    } else if (tab === 'ORGANIZERS') {
      if (selected) {
        this.organizers.update((list) =>
          list.map((o) =>
            o.id === selected.id
              ? {
                  ...o,
                  name: this.formName(),
                  email: this.formEmail(),
                  company: this.formCompany(),
                }
              : o
          )
        );
      } else {
        const newOrg: OrganizerItem = {
          id: 'org-' + Date.now(),
          name: this.formName() || 'New Organizer',
          email: this.formEmail() || 'org@cinema.com',
          company: this.formCompany() || 'Independent',
          joinedDate: today,
        };
        this.organizers.update((list) => [newOrg, ...list]);
      }
    } else if (tab === 'VENUES') {
      if (selected) {
        this.venues.update((list) =>
          list.map((v) =>
            v.id === selected.id
              ? {
                  ...v,
                  name: this.formVenueName(),
                  address: this.formAddress(),
                  capacity: Number(this.formCapacity()),
                }
              : v
          )
        );
      } else {
        const newVenue: VenueItem = {
          id: 'ven-' + Date.now(),
          name: this.formVenueName() || 'New Cinema Hall',
          address: this.formAddress() || '123 Main Street',
          capacity: Number(this.formCapacity()) || 100,
        };
        this.venues.update((list) => [newVenue, ...list]);
      }
    } else if (tab === 'MOVIES') {
      if (selected) {
        this.movies.update((list) =>
          list.map((m) =>
            m.id === selected.id
              ? {
                  ...m,
                  title: this.formTitle(),
                  genre: this.formGenre(),
                  duration: this.formDuration(),
                  rating: this.formRating(),
                  releaseDate: this.formReleaseDate(),
                }
              : m
          )
        );
      } else {
        const newMov: MovieItem = {
          id: 'mov-' + Date.now(),
          title: this.formTitle() || 'New Movie',
          genre: this.formGenre() || 'Action / Drama',
          duration: this.formDuration() || '120 min',
          rating: this.formRating() || 'PG-13',
          releaseDate: this.formReleaseDate() || today,
        };
        this.movies.update((list) => [newMov, ...list]);
      }
    }

    this.closeDrawer();
  }

  updateUserRole(user: UserItem, newRole: 'ADMIN' | 'CUSTOMER' | 'ORGANIZER') {
    if (user.email === this.currentUserEmail()) {
      return;
    }

    this.users.update((list) =>
      list.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
    );
  }

  deleteItem(item: any) {
    const tab = this.activeTab();

    if (tab === 'USERS') {
      if (item.email === this.currentUserEmail()) {
        return;
      }
      this.users.update((list) => list.filter((u) => u.id !== item.id));
    } else if (tab === 'ORGANIZERS') {
      this.organizers.update((list) => list.filter((o) => o.id !== item.id));
    } else if (tab === 'VENUES') {
      this.venues.update((list) => list.filter((v) => v.id !== item.id));
    } else if (tab === 'MOVIES') {
      this.movies.update((list) => list.filter((m) => m.id !== item.id));
    }

    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }
  }

  isCurrentUser(email: string): boolean {
    return email === this.currentUserEmail();
  }
}
