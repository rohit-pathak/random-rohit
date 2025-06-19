import { Component } from '@angular/core';
import { PostComponent } from "./post/post.component";

@Component({
  selector: 'app-home',
  imports: [
    PostComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  posts: Post[] = [
    {
      date: new Date('2024-11-28'),
      title: 'Indian Lok Sabha Elections 2024 Results Visualized',
      route: '/india-elections-2024'
    },
    {
      date: new Date('2025-05-03'),
      title: 'Resize Directives',
      route: '/resize-with-directives'
    },
    {
      date: new Date('2025-06-19'),
      title: 'International Aid Transaction Patterns',
      route: '/aid-data-viz',
    }
  ].sort((a, b) => +b.date - +a.date);
}

interface Post {
  date: Date;
  title: string;
  route: string;
}
