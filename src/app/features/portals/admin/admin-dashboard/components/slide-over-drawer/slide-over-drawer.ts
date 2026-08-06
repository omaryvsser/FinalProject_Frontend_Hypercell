import { Component, input, output, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabType } from '../../admin-dashboard';

@Component({
  selector: 'app-slide-over-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slide-over-drawer.html',
  styleUrl: './slide-over-drawer.css'
})
export class SlideOverDrawerComponent {
  isOpen = input<boolean>(false);
  activeTab = input<TabType>('USERS');
  selectedItem = input<any | null>(null);
  singularTabLabel = input<string>('User');
  currentUserEmail = input<string>('');

  formName = input.required<WritableSignal<string>>();
  formEmail = input.required<WritableSignal<string>>();
  formRole = input.required<WritableSignal<'ADMIN' | 'ORGANIZER' | 'CUSTOMER'>>();
  formCompany = input.required<WritableSignal<string>>();
  formVenueName = input.required<WritableSignal<string>>();
  formAddress = input.required<WritableSignal<string>>();
  formCapacity = input.required<WritableSignal<number>>();

  formTitle = input.required<WritableSignal<string>>();
  formGenre = input.required<WritableSignal<string>>();
  formDuration = input.required<WritableSignal<string>>();
  formRating = input.required<WritableSignal<string>>();
  formReleaseDate = input.required<WritableSignal<string>>();

  closeDrawer = output<void>();
  saveItem = output<void>();

  onClose() {
    this.closeDrawer.emit();
  }

  onSave() {
    this.saveItem.emit();
  }

  isCurrentUser(email: string): boolean {
    return email === this.currentUserEmail();
  }
}
