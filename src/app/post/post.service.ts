import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {Observable, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

import {Post} from './post';


@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiURL = "https://jsonplaceholder.typicode.com";
  private localPosts: Post[] = [];  // ← stockage local

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    })
  }

  constructor(private httpClient: HttpClient) {
    // ← charge les posts sauvegardés au démarrage
    const saved = localStorage.getItem('localPosts');
    this.localPosts = saved ? JSON.parse(saved) : [];
  }

  getAll(): Observable<any> {
    return this.httpClient.get<Post[]>(this.apiURL + '/posts', this.httpOptions).pipe(
      map(posts => [...posts, ...this.localPosts]),  // ← merge posts locaux
      catchError(this.errorHandler)
    )
  }

  create(post: Post): Observable<any> {
    return this.httpClient.post(this.apiURL + '/posts', JSON.stringify(post), this.httpOptions).pipe(
      map((res: any) => {
        const maxLocal = this.localPosts.length > 0
          ? Math.max(...this.localPosts.map(p => p.id))
          : 0;
        const newId = Math.max(100, maxLocal) + 1;  // ← toujours > 100 et > dernier local
        const newPost = { ...post, id: newId };
        this.localPosts.push(newPost);
        localStorage.setItem('localPosts', JSON.stringify(this.localPosts));  // ← persiste
        return newPost;
      }),
      catchError(this.errorHandler)
    )
  }

  find(id: number): Observable<any> {
    return this.httpClient.get(this.apiURL + '/posts/' + id).pipe(
      catchError(this.errorHandler)
    )
  }

  update(id: number, post: Post): Observable<any> {
    return this.httpClient.put(this.apiURL + '/posts/' + id, JSON.stringify(post), this.httpOptions).pipe(
      catchError(this.errorHandler)
    )
  }

  delete(id: number) {
    this.localPosts = this.localPosts.filter(p => p.id !== id);
    localStorage.setItem('localPosts', JSON.stringify(this.localPosts));  // ← persiste
    return this.httpClient.delete(this.apiURL + '/posts/' + id, this.httpOptions).pipe(
      catchError(this.errorHandler)
    )
  }

  errorHandler(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }
}
