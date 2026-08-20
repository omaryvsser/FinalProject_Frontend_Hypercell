import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataTableComponent, TableColumn, TableAction } from './data-table';

describe('DataTableComponent', () => {
  let component: DataTableComponent;
  let fixture: ComponentFixture<DataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create reusable DataTable component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute displayedColumnKeys including actions when actions are present', () => {
    const cols: TableColumn[] = [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
    ];
    const actions: TableAction[] = [
      { id: 'edit', icon: 'edit' },
    ];

    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();

    expect(component.displayedColumnKeys()).toEqual(['name', 'email', 'actions']);
  });

  it('should emit actionClick, edit, or delete when onAction is triggered', () => {
    const editSpy = vi.fn();
    const actionSpy = vi.fn();
    component.edit.subscribe(editSpy);
    component.actionClick.subscribe(actionSpy);

    const testRow = { id: 1, name: 'Sample Item' };
    const editAction: TableAction = { id: 'edit', icon: 'edit' };

    component.onAction(editAction, testRow);

    expect(editSpy).toHaveBeenCalledWith(testRow);
    expect(actionSpy).toHaveBeenCalledWith({ action: 'edit', row: testRow });
  });

  it('should not emit action if action is disabled', () => {
    const actionSpy = vi.fn();
    component.actionClick.subscribe(actionSpy);

    const testRow = { id: 1, name: 'Admin', isProtected: true };
    const deleteAction: TableAction = {
      id: 'delete',
      icon: 'delete',
      disabled: (r) => r.isProtected,
    };

    component.onAction(deleteAction, testRow);
    expect(actionSpy).not.toHaveBeenCalled();
  });

  it('should emit pageChange on onGoToPage with valid page number', () => {
    const pageSpy = vi.fn();
    component.pageChange.subscribe(pageSpy);

    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    component.onGoToPage(3);
    expect(pageSpy).toHaveBeenCalledWith(3);
  });
});
