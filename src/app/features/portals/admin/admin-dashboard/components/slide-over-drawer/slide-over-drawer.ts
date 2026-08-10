import { Component, input, output, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TabType, VenueItem } from '../../admin-dashboard';

@Component({
  selector: 'app-slide-over-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatInputModule],
  templateUrl: './slide-over-drawer.html',
  styleUrl: './slide-over-drawer.css'
})
export class SlideOverDrawerComponent {
  isOpen = input<boolean>(false);
  activeTab = input<TabType>('USERS');
  selectedItem = input<any | null>(null);
  singularTabLabel = input<string>('User');
  currentUserEmail = input<string>('');
  venues = input<VenueItem[]>([]);

  readonly categories = [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Romance',
    'Science Fiction',
    'Animation',
  ];

  formName = input.required<WritableSignal<string>>();
  formEmail = input.required<WritableSignal<string>>();
  formRole = input.required<WritableSignal<'ADMIN' | 'ORGANIZER' | 'CUSTOMER'>>();
  formCompany = input.required<WritableSignal<string>>();
  formVenueName = input.required<WritableSignal<string>>();
  formAddress = input.required<WritableSignal<string>>();
  formCapacity = input.required<WritableSignal<number>>();

  formTitle = input.required<WritableSignal<string>>();
  formDescription = input.required<WritableSignal<string>>();
  formImageUrl = input.required<WritableSignal<string>>();
  formGenre = input.required<WritableSignal<string>>();
  formStatus = input.required<WritableSignal<'DRAFT' | 'PUBLISHED'>>();
  formDirector = input.required<WritableSignal<string>>();
  formDurationMinutes = input.required<WritableSignal<number | string>>();
  formLanguage = input.required<WritableSignal<string>>();

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.formImageUrl().set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }
  formStartDate = input.required<WritableSignal<string>>();
  formEndDate = input.required<WritableSignal<string>>();
  formVenueId = input.required<WritableSignal<number>>();

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
