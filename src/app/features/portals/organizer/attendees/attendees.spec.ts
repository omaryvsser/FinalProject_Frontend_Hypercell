import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Attendees } from './attendees';

describe('Attendees', () => {
  let component: Attendees;

  beforeEach(() => {
    component = new Attendees();
  });

  it('should create attendees component', () => {
    expect(component).toBeTruthy();
  });
});
