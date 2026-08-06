import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { AdminDashboardComponent } from './admin-dashboard';

describe('AdminDashboardComponent (Signal Logic)', () => {
  let component: AdminDashboardComponent;

  beforeEach(() => {
    component = new AdminDashboardComponent();
  });

  it('should instantiate the admin dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to USERS tab and page 1', () => {
    expect(component.activeTab()).toBe('USERS');
    expect(component.currentPage()).toBe(1);
    expect(component.pageSize()).toBe(5);
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
    expect(component.formName()).toBe('Ahmed El-Sayed');
    expect(component.formEmail()).toBe('ahmed.sayed@cinema.eg');
  });

  it('should safeguard logged-in user from deletion', () => {
    const currentUser = component.users().find((u) => u.email === component.currentUserEmail());
    expect(currentUser).toBeTruthy();

    const initialUserCount = component.users().length;
    component.deleteItem(currentUser);

    // Count should remain unchanged
    expect(component.users().length).toBe(initialUserCount);
  });

  it('should allow deleting non-logged-in user', () => {
    const targetUser = component.users().find((u) => u.email !== component.currentUserEmail())!;
    const initialUserCount = component.users().length;

    component.deleteItem(targetUser);
    expect(component.users().length).toBe(initialUserCount - 1);
  });

  it('should add a new venue via drawer form', () => {
    component.setActiveTab('VENUES');
    component.openAddDrawer();

    component.formVenueName.set('Metropolis Screen 1');
    component.formAddress.set('999 Cyber Way');
    component.formCapacity.set(300);

    component.saveDrawerItem();

    expect(component.venues().length).toBe(9);
    expect(component.venues()[0].name).toBe('Metropolis Screen 1');
  });
});
