import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { AdminDashboardComponent } from './admin-dashboard';

describe('AdminDashboardComponent (Signal Logic)', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should instantiate the admin dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to USERS tab and page 1', () => {
    expect(component.activeTab()).toBe('USERS');
    expect(component.currentPage()).toBe(1);
  });


  it('should compute metric summary totals correctly', () => {
    expect(component.totalUsersCount()).toBe(9);
    expect(component.activeOrganizersCount()).toBe(8);
    expect(component.registeredVenuesCount()).toBe(8);
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
      const initialUserCount = component.users().length;
      component.deleteItem(currentUser);
      expect(component.users().length).toBe(initialUserCount);
    }
  });

  it('should allow deleting non-logged-in user', () => {
    const targetUser = component.users().find((u) => u.email !== component.currentUserEmail());
    if (targetUser) {
      const initialUserCount = component.users().length;
      component.deleteItem(targetUser);
      expect(component.users().length).toBe(initialUserCount - 1);
    }
  });

  it('should add a new venue via drawer form', () => {
    component.setActiveTab('VENUES');
    component.openAddDrawer();

    component.venueModel.set({
      name: 'Metropolis Screen 1',
      address: '999 Cyber Way',
      capacity: 300,
    });

    expect(component.venueModel().name).toBe('Metropolis Screen 1');
    expect(component.venueForm().valid()).toBe(true);
  });
});

