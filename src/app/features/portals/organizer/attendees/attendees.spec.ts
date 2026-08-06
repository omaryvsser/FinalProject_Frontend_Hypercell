import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Attendees } from './attendees';

describe('Attendees', () => {
  let component: Attendees;
  let fixture: ComponentFixture<Attendees>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Attendees],
    }).compileComponents();

    fixture = TestBed.createComponent(Attendees);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
