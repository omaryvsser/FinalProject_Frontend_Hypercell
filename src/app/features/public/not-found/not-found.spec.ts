import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { NotFound } from './not-found';

describe('NotFound Component', () => {
  let component: NotFound;

  beforeEach(() => {
    component = new NotFound();
  });

  it('should create the 404 not found component', () => {
    expect(component).toBeTruthy();
  });
});
