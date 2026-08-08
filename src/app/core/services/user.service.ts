import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UserDto } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getUserById(id: number) {
    return this.http.get<UserDto>(`${environment.apiUrl}/v1/users/${id}`);
  }
}
