import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { EventEditor } from './event-editor';

describe('EventEditor', () => {
  let component: EventEditor;
  let fixture: ComponentFixture<EventEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventEditor],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EventEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create event editor component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize eventModel and eventForm with default state', () => {
    expect(component.eventModel().status).toBe('DRAFT');
    expect(component.eventForm().invalid()).toBe(true);
  });
});

