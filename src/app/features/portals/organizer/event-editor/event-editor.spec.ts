import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventEditor } from './event-editor';

describe('EventEditor', () => {
  let component: EventEditor;
  let fixture: ComponentFixture<EventEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(EventEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
