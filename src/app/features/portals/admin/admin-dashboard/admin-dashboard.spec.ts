import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { AdminDashboardComponent } from './admin-dashboard';
import { UserService } from '../../../../core/services/user.service';
import { VenueService } from '../../../../core/services/venue.service';
import { EventService } from '../../../../core/services/event.service';
import { AuthService } from '../../../../core/services/auth.service';

describe('AdminDashboardComponent (Signal Logic)', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let userServiceMock: any;
  let venueServiceMock: any;
  let eventServiceMock: any;
  let authServiceMock: any;

  const mockUsersList = [
    { id: 1, name: 'Admin One', email: 'admin@cinema.eg', role: 'ADMIN' },
    { id: 2, name: 'Ahmed El-Sayed', email: 'ahmed@cinema.eg', role: 'ORGANIZER' },
    { id: 3, name: 'Sara Ali', email: 'sara@cinema.eg', role: 'ORGANIZER' },
    { id: 4, name: 'Tarek Nour', email: 'tarek@cinema.eg', role: 'ORGANIZER' },
    { id: 5, name: 'Mona Zaki', email: 'mona@cinema.eg', role: 'ORGANIZER' },
    { id: 6, name: 'Hany Adel', email: 'hany@cinema.eg', role: 'ORGANIZER' },
    { id: 7, name: 'Nour Ezz', email: 'nour@cinema.eg', role: 'ORGANIZER' },
    { id: 8, name: 'Karim Eid', email: 'karim@cinema.eg', role: 'ORGANIZER' },
    { id: 9, name: 'Laila Murad', email: 'laila@cinema.eg', role: 'ORGANIZER' },
  ];

  const mockVenuesList = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Venue ${i + 1}`,
    address: 'Cairo, Egypt',
    capacity: 500,
  }));

  const mockEventsList = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    title: `Movie ${i + 1}`,
    category: 'Action',
    startDate: '2026-08-01T20:00:00',
    durationMinutes: 120,
  }));

  beforeEach(async () => {
    userServiceMock = {
      getAllUsers: vi.fn().mockReturnValue(of(mockUsersList)),
      getPaginatedUsers: vi.fn().mockImplementation((page: number, size: number) => {
        const start = (page - 1) * size;
        const slice = mockUsersList.slice(start, start + size);
        return of({
          content: slice,
          totalElements: mockUsersList.length,
          totalPages: Math.ceil(mockUsersList.length / size),
          size,
          number: page - 1,
        });
      }),
      updateUserRole: vi.fn().mockReturnValue(of({ id: 2, role: 'ORGANIZER' })),
      deleteUser: vi.fn().mockReturnValue(of(void 0)),
    };

    venueServiceMock = {
      getVenues: vi.fn().mockReturnValue(of(mockVenuesList)),
      getPaginatedVenues: vi.fn().mockImplementation((page: number, size: number) => {
        const start = (page - 1) * size;
        const slice = mockVenuesList.slice(start, start + size);
        return of({
          content: slice,
          totalElements: mockVenuesList.length,
          totalPages: Math.ceil(mockVenuesList.length / size),
          size,
          number: page - 1,
        });
      }),
      createVenue: vi.fn().mockReturnValue(of({ id: 9, name: 'New Venue', address: 'Cairo', capacity: 100 })),
      deleteVenue: vi.fn().mockReturnValue(of(void 0)),
    };

    eventServiceMock = {
      getOrganizerEvents: vi.fn().mockImplementation((page: number, size: number) => {
        const start = (page - 1) * size;
        const slice = mockEventsList.slice(start, start + size);
        return of({
          content: slice,
          totalElements: mockEventsList.length,
          totalPages: Math.ceil(mockEventsList.length / size),
          size,
          number: page - 1,
        });
      }),
      deleteEvent: vi.fn().mockReturnValue(of(void 0)),
    };

    authServiceMock = {
      currentUser: vi.fn().mockReturnValue({ email: 'admin@cinema.eg' }),
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: UserService, useValue: userServiceMock },
        { provide: VenueService, useValue: venueServiceMock },
        { provide: EventService, useValue: eventServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should instantiate the admin dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to USERS tab and page 1', () => {
    expect(component.activeTab()).toBe('USERS');
    expect(component.currentPage()).toBe(1);
  });

  it('should compute full metric summary totals from backend', () => {
    expect(component.totalUsersCount()).toBe(9);
    expect(component.totalOrganizersCount()).toBe(8);
    expect(component.totalVenuesCount()).toBe(8);
    expect(component.totalMoviesCount()).toBe(8);
  });

  it('should paginate users 5 items per page', () => {
    expect(component.paginatedUsers().length).toBe(5);
    expect(component.totalPages()).toBe(2);
  });

  it('should switch tabs and reset page to 1', () => {
    component.goToPage(2);
    expect(component.currentPage()).toBe(2);

    component.setActiveTab('VENUES');
    expect(component.activeTab()).toBe('VENUES');
    expect(component.currentPage()).toBe(1);
  });

  it('should open drawer in Add mode and close drawer', () => {
    component.openAddDrawer();
    expect(component.isDrawerOpen()).toBe(true);
    expect(component.selectedItem()).toBeNull();

    component.closeDrawer();
    expect(component.isDrawerOpen()).toBe(false);
  });

  it('should open drawer in Edit mode with selected user item', () => {
    const userToEdit = component.users()[1]; // Ahmed El-Sayed
    component.openEditDrawer(userToEdit);

    expect(component.isDrawerOpen()).toBe(true);
    expect(component.selectedItem()).toEqual(userToEdit);
    expect(component.userModel().name).toBe(userToEdit?.name || '');
    expect(component.userModel().email).toBe(userToEdit?.email || '');
  });

  it('should safeguard logged-in user from deletion', () => {
    const currentUser = component.users().find((u) => u.email === component.currentUserEmail());
    if (currentUser) {
      component.deleteItem(currentUser);
      expect(userServiceMock.deleteUser).not.toHaveBeenCalled();
    }
  });

  it('should configure table columns and actions according to active tab', () => {
    expect(component.tableColumns().length).toBe(4);
    expect(component.tableActions().length).toBe(2);
  });
});
