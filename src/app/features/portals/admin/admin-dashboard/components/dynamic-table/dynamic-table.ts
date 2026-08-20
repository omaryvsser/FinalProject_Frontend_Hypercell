import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TabType, UserItem, OrganizerItem, VenueItem, MovieItem } from '../../admin-dashboard';

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './dynamic-table.html',
  styleUrl: './dynamic-table.css'
})

export class DynamicTableComponent {
  // Inputs from Parent Smart Component
  activeTab = input<TabType>('USERS');
  users = input<UserItem[]>([]);
  organizers = input<OrganizerItem[]>([]);
  venues = input<VenueItem[]>([]);
  movies = input<MovieItem[]>([]);

  currentUserEmail = input<string>('');
  totalItems = input<number>(0);
  currentPage = input<number>(1);
  totalPages = input<number>(1);
  pagesArray = input<number[]>([]);

  // Outputs to Parent Smart Component
  editItem = output<any>();
  deleteItem = output<any>();
  roleChange = output<{ user: UserItem; newRole: 'ADMIN' | 'ORGANIZER' | 'CUSTOMER' }>();
  pageChange = output<number>();

  // Computed Signal for Active Table Columns (Modern Angular Best Practice)
  displayedColumns = computed<string[]>(() => {
    switch (this.activeTab()) {
      case 'USERS':
        return ['name', 'email', 'role', 'joinedDate', 'actions'];
      case 'ORGANIZERS':
        return ['name', 'email', 'company', 'joinedDate', 'actions'];
      case 'VENUES':
        return ['name', 'address', 'capacity', 'actions'];
      case 'MOVIES':
        return ['title', 'genre', 'duration', 'rating', 'releaseDate', 'actions'];
    }
  });

  // Computed Signal for Current Dataset
  currentData = computed<any[]>(() => {
    switch (this.activeTab()) {
      case 'USERS':
        return this.users();
      case 'ORGANIZERS':
        return this.organizers();
      case 'VENUES':
        return this.venues();
      case 'MOVIES':
        return this.movies();
    }
  });

  onEdit(item: any) {
    this.editItem.emit(item);
  }

  onDelete(item: any) {
    this.deleteItem.emit(item);
  }

  onRoleUpdate(user: UserItem, newRole: 'ADMIN' | 'ORGANIZER' | 'CUSTOMER') {
    this.roleChange.emit({ user, newRole });
  }

  onGoToPage(page: number) {
    this.pageChange.emit(page);
  }

  isCurrentUser(email: string): boolean {
    return email === this.currentUserEmail();
  }
}
