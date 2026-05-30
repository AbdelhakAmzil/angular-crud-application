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
  private updatedPosts: { [id: number]: Post } = {};  // ← stockage updates
  private deletedIds: number[] = [];  // ← ajouté

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

    const savedUpdates = localStorage.getItem('updatedPosts');  // ← charge updates
    this.updatedPosts = savedUpdates ? JSON.parse(savedUpdates) : {};

    const savedDeleted = localStorage.getItem('deletedIds');  // ← ajouté
    this.deletedIds = savedDeleted ? JSON.parse(savedDeleted) : [];
  }

  getAll(): Observable<any> {
    return this.httpClient.get<Post[]>(this.apiURL + '/posts', this.httpOptions).pipe(
      map(posts => {
        const merged = posts
          .filter(p => !this.deletedIds.includes(Number(p.id)))  // ← cast
          .map(p => this.updatedPosts[Number(p.id)] ? this.updatedPosts[Number(p.id)] : p);
        const localFiltered = this.localPosts.filter(p => !this.deletedIds.includes(Number(p.id)));
        return [...merged, ...localFiltered];
      }),
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
    // post local créé par l'utilisateur
    const localPost = this.localPosts.find(p => p.id === id);
    if (localPost) return new Observable<any>(obs => {obs.next(localPost); obs.complete(); });

    return this.httpClient.get<Post>(this.apiURL + '/posts/' + id).pipe(
      map(p => this.updatedPosts[p.id] ? this.updatedPosts[p.id] : p),
      catchError(this.errorHandler)
    )
  }

  update(id: number, post: Post): Observable<any> {
    return this.httpClient.put(this.apiURL + '/posts/' + id, JSON.stringify(post), this.httpOptions).pipe(
      map((res: any) => {
        const numId = Number(id);  // ← cast
        const updated = { ...post, id: numId };

        const localIndex = this.localPosts.findIndex(p => Number(p.id) == numId);
        if (localIndex !== -1) {
          this.localPosts[localIndex] = updated;
          localStorage.setItem('localPosts', JSON.stringify(this.localPosts));
        } else {
          this.updatedPosts[numId] = updated;
          localStorage.setItem('updatedPosts', JSON.stringify(this.updatedPosts));
        }
        return updated;
      }),
      catchError(this.errorHandler)
    )
  }

  delete(id: number) {
    const numId = Number(id);  // ← cast

    const localIndex = this.localPosts.findIndex(p => Number(p.id) == numId);
    if (localIndex !== -1) {
      this.localPosts.splice(localIndex, 1);
      localStorage.setItem('localPosts', JSON.stringify(this.localPosts));
    } else {
      this.deletedIds.push(numId);
      localStorage.setItem('deletedIds', JSON.stringify(this.deletedIds));
    }

    return this.httpClient.delete(this.apiURL + '/posts/' + numId, this.httpOptions).pipe(
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
