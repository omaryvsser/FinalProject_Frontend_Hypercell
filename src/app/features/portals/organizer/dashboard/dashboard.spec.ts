import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { Dashboard } from './dashboard';
import { EventService } from '../../../../core/services/event.service';
import { VenueService } from '../../../../core/services/venue.service';

describe('Dashboard (Organizer Portal)', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let eventServiceMock: any;
  let venueServiceMock: any;

  const mockOrganizerMovies = [
    {
      id: 1,
      title: 'Inception',
      category: 'Sci-Fi',
      startDate: '2026-08-01T20:00:00',
      status: 'PUBLISHED',
      venueName: 'Grand Cinema',
      bookingsCount: 200,
      attendeesCount: 250,
    },
    {
      id: 2,
      title: 'Interstellar',
      category: 'Sci-Fi',
      startDate: '2026-08-02T20:00:00',
      status: 'PUBLISHED',
      venueName: 'Grand Cinema',
      bookingsCount: 300,
      attendeesCount: 350,
    },
    {
      id: 3,
      title: 'Dunkirk',
      category: 'War',
      startDate: '2026-08-03T20:00:00',
      status: 'PUBLISHED',
      venueName: 'IMAX Plaza',
      bookingsCount: 166,
      attendeesCount: 178,
    },
    {
      id: 4,
      title: 'Tenet',
      category: 'Action',
      startDate: '2026-08-04T20:00:00',
      status: 'DRAFT',
      venueName: 'City Center',
      bookingsCount: 0,
      attendeesCount: 0,
    },
    {
      id: 5,
      title: 'Oppenheimer',
      category: 'Drama',
      startDate: '2026-08-05T20:00:00',
      status: 'COMPLETED',
      venueName: 'Vox Cinema',
      bookingsCount: 0,
      attendeesCount: 0,
    },
    {
      id: 6,
      title: 'Memento',
      category: 'Mystery',
      startDate: '2026-08-06T20:00:00',
      status: 'COMPLETED',
      venueName: 'Vox Cinema',
      bookingsCount: 0,
      attendeesCount: 0,
    },
  ];

  beforeEach(async () => {
    eventServiceMock = {
      getOrganizerEvents: vi.fn().mockImplementation((page: number, size: number) => {
        if (size >= 100) {
          return of({
            content: mockOrganizerMovies,
            totalElements: mockOrganizerMovies.length,
            totalPages: 1,
          });
        }
        const start = (page - 1) * size;
        const slice = mockOrganizerMovies.slice(start, start + size);
        return of({
          content: slice,
          totalElements: mockOrganizerMovies.length,
          totalPages: Math.ceil(mockOrganizerMovies.length / size),
          size,
          number: page - 1,
        });
      }),
      deleteEvent: vi.fn().mockReturnValue(of(void 0)),
      createEvent: vi.fn().mockReturnValue(of({ id: 10 })),
      updateEvent: vi.fn().mockReturnValue(of({ id: 1 })),
      getSeatCategories: vi.fn().mockReturnValue(of([])),
    };

    venueServiceMock = {
      getVenues: vi.fn().mockReturnValue(of([{ id: 1, name: 'Grand Cinema' }])),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: EventService, useValue: eventServiceMock },
        { provide: VenueService, useValue: venueServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should instantiate the organizer dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute full total movies, published, draft, completed, bookings, and attendees correctly', () => {
    expect(component.totalMovies()).toBe(6);
    expect(component.publishedMovies()).toBe(3);
    expect(component.draftMovies()).toBe(1);
    expect(component.completedMovies()).toBe(2);
    expect(component.totalBookings()).toBe(666);
    expect(component.totalAttendees()).toBe(778);
  });

  it('should filter movies by active tab', () => {
    component.setActiveTab('PUBLISHED');
    expect(component.filteredMovies().length).toBe(3);

    component.setActiveTab('DRAFT');
    expect(component.filteredMovies().length).toBe(1);
  });

  it('should open drawer in add mode and close drawer', () => {
    component.openAddDrawer();
    expect(component.isDrawerOpen()).toBe(true);
    expect(component.selectedMovie()).toBeNull();

    component.closeDrawer();
    expect(component.isDrawerOpen()).toBe(false);
  });

  it('should open drawer in edit mode with selected movie', () => {
    const movieToEdit = component.organizerMovies()[0];
    if (movieToEdit) {
      component.openEditDrawer(movieToEdit);

      expect(component.isDrawerOpen()).toBe(true);
      expect(component.selectedMovie()).toEqual(movieToEdit);
      expect(component.movieModel().title).toBe(movieToEdit.title);
    }
  });

  it('should configure table columns and actions correctly', () => {
    expect(component.tableColumns.length).toBe(4);
    expect(component.tableActions.length).toBe(3);
  });
});
