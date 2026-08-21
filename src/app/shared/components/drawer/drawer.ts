import { Component, input, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
})
export class DrawerComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly wide = input<boolean>(false);
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);

  readonly close = output<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.onClose();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.isOpen() && this.closeOnEscape()) {
      event.preventDefault();
      this.onClose();
    }
  }
}
