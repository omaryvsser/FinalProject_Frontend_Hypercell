import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, MatButtonModule, MatDividerModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {}
