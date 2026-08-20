import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { Attendees } from './attendees';

describe('Attendees', () => {
  let component: Attendees;
  let fixture: ComponentFixture<Attendees>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Attendees],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Attendees);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create attendees component', () => {
    expect(component).toBeTruthy();
  });

  it('should configure 7 table columns for attendee bookings', () => {
    expect(component.tableColumns.length).toBe(7);
  });
});
