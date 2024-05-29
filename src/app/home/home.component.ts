import { Component } from '@angular/core';
import { PostComponent } from "./post/post.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    PostComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  posts: Post[] = [
    { date: new Date('2024-05-29'), title: 'Aid Data Visualization', route: '/aid-data'}
  ]
}

interface Post {
  date: Date;
  title: string;
  route: string;
}
