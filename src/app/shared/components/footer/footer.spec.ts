import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Footer } from './footer';

describe('Footer Component', () => {
  let component: Footer;

  beforeEach(() => {
    component = new Footer();
  });

  it('should create footer component', () => {
    expect(component).toBeTruthy();
  });

  it('should render current year correctly', () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });
});
