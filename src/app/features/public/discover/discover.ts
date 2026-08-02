import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MovieCard } from '../../../shared/components/movie-card/movie-card';

@Component({
  selector: 'app-discover',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MovieCard],
  templateUrl: './discover.html',
  styleUrl: './discover.css',
})
export class Discover {}