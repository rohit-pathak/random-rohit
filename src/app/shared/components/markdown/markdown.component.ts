import { Component, computed, input } from '@angular/core';
import { parse } from "marked";

@Component({
  selector: 'app-markdown',
  imports: [],
  template: `
    <div [innerHTML]="parsedHTML()"></div>
  `,
})
export class MarkdownComponent {
  content = input.required<string>();
  parsedHTML = computed(() => parse(this.content()));
}
