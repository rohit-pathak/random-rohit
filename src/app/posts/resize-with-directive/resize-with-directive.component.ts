import { Component, inject } from '@angular/core';
import { PostService } from "../../shared/services/post.service";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-resize-with-directive',
  imports: [],
  templateUrl: './resize-with-directive.component.html',
  styleUrl: './resize-with-directive.component.scss'
})
export class ResizeWithDirectiveComponent {

  private postService = inject(PostService);
  postMd = toSignal(this.postService.getPost('resize-directive-post.md'));
}
