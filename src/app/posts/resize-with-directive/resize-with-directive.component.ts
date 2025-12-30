import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { PostService } from "../../shared/services/post.service";
import { toSignal } from "@angular/core/rxjs-interop";
import { MarkdownComponent } from "../../shared/components/markdown/markdown.component";

@Component({
  selector: 'app-resize-with-directive',
  imports: [
    MarkdownComponent
  ],
  templateUrl: './resize-with-directive.component.html',
  styleUrl: './resize-with-directive.component.scss'
})
export class ResizeWithDirectiveComponent {

  private readonly postService = inject(PostService);
  private readonly meta = inject(Meta);
  protected readonly postMd = toSignal(this.postService.getPost('resize-directive-post.md'));

  constructor() {
    this.meta.updateTag({
      name: 'description',
      content: 'Learn how to observe resize events in Angular using HostDirectives and ResizeObserver API.'
    });
  }
}
