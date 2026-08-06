import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Dashboard } from './dashboard';

describe('Dashboard (Organizer Portal)', () => {
  let component: Dashboard;

  beforeEach(() => {
    component = new Dashboard();
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
    component.openEditDrawer(movieToEdit);

    expect(component.isDrawerOpen()).toBe(true);
    expect(component.selectedMovie()).toEqual(movieToEdit);
    expect(component.formTitle()).toBe('Interstellar');
  });
});
