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
    { date: new Date('2024-11-28'), title: 'Indian Lok Sabha Elections 2024 Results Visualized', route: '/india-elections-2024'}
  ]
}

interface Post {
  date: Date;
  title: string;
  route: string;
}
