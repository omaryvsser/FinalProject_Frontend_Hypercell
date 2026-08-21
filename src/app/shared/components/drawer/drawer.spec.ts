import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrawerComponent } from './drawer';

@Component({
  standalone: true,
  imports: [DrawerComponent],
  template: `
    <app-drawer
      [isOpen]="isOpen()"
      [title]="title()"
      [subtitle]="subtitle()"
      [wide]="wide()"
      (close)="onClose()"
    >
      <div id="projected-content">Drawer Form Content</div>
    </app-drawer>
  `,
})
class TestHostComponent {
  readonly isOpen = signal<boolean>(false);
  readonly title = signal<string>('Test Drawer');
  readonly subtitle = signal<string>('Test Subtitle');
  readonly wide = signal<boolean>(false);
  readonly onClose = vi.fn();
}

describe('DrawerComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, DrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create drawer component', () => {
    expect(fixture.nativeElement.querySelector('app-drawer')).toBeTruthy();
  });

  it('should project content into drawer-body', () => {
    const projected = fixture.nativeElement.querySelector('#projected-content');
    expect(projected).toBeTruthy();
    expect(projected.textContent).toContain('Drawer Form Content');
  });

  it('should reflect isOpen state with .open class', () => {
    const wrapper = fixture.nativeElement.querySelector('.drawer-wrapper');
    expect(wrapper.classList.contains('open')).toBe(false);

    hostComponent.isOpen.set(true);
    fixture.detectChanges();
    expect(wrapper.classList.contains('open')).toBe(true);
  });

  it('should display title and subtitle', () => {
    const titleEl = fixture.nativeElement.querySelector('.drawer-title');
    const subtitleEl = fixture.nativeElement.querySelector('.drawer-subtitle');

    expect(titleEl.textContent).toContain('Test Drawer');
    expect(subtitleEl.textContent).toContain('Test Subtitle');
  });

  it('should emit close event on close button click', () => {
    hostComponent.isOpen.set(true);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.btn-close-drawer');
    closeBtn.click();

    expect(hostComponent.onClose).toHaveBeenCalled();
  });

  it('should emit close event on backdrop click', () => {
    hostComponent.isOpen.set(true);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.drawer-backdrop');
    backdrop.click();

    expect(hostComponent.onClose).toHaveBeenCalled();
  });

  it('should apply wide-panel class when wide is true', () => {
    hostComponent.wide.set(true);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.drawer-panel');
    expect(panel.classList.contains('wide-panel')).toBe(true);
  });
});
