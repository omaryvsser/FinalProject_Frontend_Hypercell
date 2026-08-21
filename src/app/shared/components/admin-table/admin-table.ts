import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

export type ColumnType =
  | 'text'
  | 'user'
  | 'roleSelect'
  | 'badge'
  | 'capacity'
  | 'rating'
  | 'date'
  | 'currency'
  | 'movieTitle'
  | 'venuePill'
  | 'status'
  | 'attendee'
  | 'bookingStatus';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  type?: ColumnType;
  badgeClass?: string | ((row: T) => string);
  format?: (value: any, row: T) => string;
}

export interface TableAction<T = any> {
  id: string;
  label: string;
  icon: string;
  class?: string;
  cssClass?: string;
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
}

@Component({
  selector: 'app-admin-table',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './admin-table.html',
  styleUrl: './admin-table.css',
})
export class AdminTableComponent {
  readonly data = input<any[]>([]);
  readonly columns = input<TableColumn[]>([]);
  readonly actions = input<TableAction[]>([]);
  readonly emptyMessage = input<string>('No records found.');
  readonly emptyIcon = input<string>('inbox');
  readonly currentUserEmail = input<string>('');

  // Pagination inputs
  readonly totalItems = input<number>(0);
  readonly currentPage = input<number>(1);
  readonly totalPages = input<number>(1);
  readonly pageSize = input<number>(5);
  readonly pagesArray = input<number[]>([1]);
  readonly showPagination = input<boolean>(true);

  // Outputs
  readonly edit = output<any>();
  readonly delete = output<any>();
  readonly actionClick = output<{ action: string; row: any }>();
  readonly roleChange = output<{ row: any; newRole: string }>();
  readonly pageChange = output<number>();

  onAction(action: TableAction, row: any): void {
    if (action.disabled && action.disabled(row)) return;

    if (action.id === 'edit') {
      this.edit.emit(row);
    } else if (action.id === 'delete') {
      this.delete.emit(row);
    }
    this.actionClick.emit({ action: action.id, row });
  }

  onRoleUpdate(row: any, newRole: string): void {
    this.roleChange.emit({ row, newRole });
  }

  onGoToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }

  isCurrentUser(email: string): boolean {
    return !!email && email === this.currentUserEmail();
  }

  getCellValue(row: any, col: TableColumn): any {
    if (!row) return '';
    const val = row[col.key];
    if (col.format) {
      return col.format(val, row);
    }
    return val ?? '';
  }

  getEndItemIndex(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  }
}
