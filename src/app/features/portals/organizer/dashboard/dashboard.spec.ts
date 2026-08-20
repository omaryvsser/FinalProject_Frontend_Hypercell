import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { Dashboard } from './dashboard';

describe('Dashboard (Organizer Portal)', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should instantiate the organizer dashboard component', () => {
    expect(component).toBeTruthy();
  });


  it('should compute total movies, published, bookings, and attendees correctly', () => {
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
});

