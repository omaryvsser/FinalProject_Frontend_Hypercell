import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { Discover } from './discover';

describe('Discover', () => {
  let component: Discover;
  let fixture: ComponentFixture<Discover>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Discover],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Discover);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to "All" genre filter', () => {
    expect(component.selectedGenre()).toBe('All');
  });

  it('should update selected genre on selectGenre()', () => {
    component.selectGenre('Action');
    expect(component.selectedGenre()).toBe('Action');

    component.selectGenre('Comedy');
    expect(component.selectedGenre()).toBe('Comedy');

    component.selectGenre('All');
    expect(component.selectedGenre()).toBe('All');
  });

  it('should return valid icons for each genre via getGenreIcon()', () => {
    expect(component.getGenreIcon('All')).toBe('local_movies');
    expect(component.getGenreIcon('Science Fiction')).toBe('rocket_launch');
    expect(component.getGenreIcon('Action')).toBe('bolt');
    expect(component.getGenreIcon('Comedy')).toBe('sentiment_very_satisfied');
    expect(component.getGenreIcon('Drama')).toBe('theater_comedy');
    expect(component.getGenreIcon('Horror')).toBe('psychology_alt');
  });

  it('should filter movies according to selected genre', () => {
    component.movies.set([
      {
        id: 101,
        title: 'SciFi Adventure',
        genre: 'Science Fiction',
        duration: '2h',
        rating: '8.5',
        showtime: '8:00 PM',
        cinemaName: 'Vox Cairo',
      },
      {
        id: 102,
        title: 'Action Blast',
        genre: 'Action',
        duration: '1h 45m',
        rating: '7.9',
        showtime: '9:00 PM',
        cinemaName: 'Zamalek Cinema',
      },
    ]);

    expect(component.filteredMovies().length).toBe(2);

    component.selectGenre('Action');
    expect(component.filteredMovies().length).toBe(1);
    expect(component.filteredMovies()[0].title).toBe('Action Blast');

    component.selectGenre('Science Fiction');
    expect(component.filteredMovies().length).toBe(1);
    expect(component.filteredMovies()[0].title).toBe('SciFi Adventure');

    component.selectGenre('All');
    expect(component.filteredMovies().length).toBe(2);
  });
});
