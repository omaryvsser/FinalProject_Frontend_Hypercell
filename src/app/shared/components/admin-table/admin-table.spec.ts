import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminTableComponent, TableColumn, TableAction } from './admin-table';

describe('AdminTableComponent', () => {
  let component: AdminTableComponent;
  let fixture: ComponentFixture<AdminTableComponent>;

  const mockColumns: TableColumn[] = [
    { key: 'name', header: 'Name', type: 'user' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', type: 'roleSelect' },
  ];

  const mockData = [
    { id: 1, name: 'Admin User', email: 'admin@cinema.eg', role: 'ADMIN' },
    { id: 2, name: 'Normal User', email: 'user@cinema.eg', role: 'CUSTOMER' },
  ];

  const mockActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'edit' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      disabled: (row) => row.email === 'admin@cinema.eg',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('actions', mockActions);
    fixture.componentRef.setInput('currentUserEmail', 'admin@cinema.eg');
    fixture.componentRef.setInput('totalItems', 2);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 1);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create admin-table component', () => {
    expect(component).toBeTruthy();
  });

  it('should render table headers correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headers = compiled.querySelectorAll('th');
    expect(headers.length).toBe(4); // 3 columns + actions
    expect(headers[0].textContent?.trim()).toBe('Name');
    expect(headers[1].textContent?.trim()).toBe('Email');
    expect(headers[2].textContent?.trim()).toBe('Role');
    expect(headers[3].textContent?.trim()).toBe('Actions');
  });

  it('should render table rows matching data', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });


  it('should emit edit event on edit action click', () => {
    const spy = vi.spyOn(component.edit, 'emit');
    component.onAction(mockActions[0], mockData[0]);
    expect(spy).toHaveBeenCalledWith(mockData[0]);
  });

  it('should not emit delete event if action is disabled', () => {
    const spy = vi.spyOn(component.delete, 'emit');
    component.onAction(mockActions[1], mockData[0]); // Disabled for admin
    expect(spy).not.toHaveBeenCalled();
  });
});
