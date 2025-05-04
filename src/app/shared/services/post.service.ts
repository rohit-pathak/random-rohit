import { inject, Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);

  getPost(postId: string): Observable<string> {
    return this.http.get(`/posts/${postId}`, { responseType: "text" });
  }
}
