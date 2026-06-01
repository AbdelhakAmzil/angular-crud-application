# 📋 Angular 21 CRUD Application

Une application CRUD complète construite avec **Angular 21**, **Bootstrap 5** et l'API **JSONPlaceholder**, avec persistance locale via `localStorage`.

---

## 🚀 Fonctionnalités

- ✅ Liste des posts avec **pagination** (20 posts par page)
- ✅ **Créer** un nouveau post
- ✅ **Voir** le détail d'un post
- ✅ **Modifier** un post existant
- ✅ **Supprimer** un post
- ✅ Persistance des données via `localStorage` (survie au rechargement)
- ✅ Compatible Angular 21 (nouvelle syntaxe `@for`, `@if`)

---

## 🛠️ Technologies utilisées

| Technologie | Version |
|---|---|
| Angular | ^21.2.0 |
| Angular CLI | ^21.2.13 |
| Bootstrap | ^5.3.8 |
| TypeScript | ~5.9.2 |
| RxJS | ~7.8.0 |
| Node Package Manager | npm@11.13.0 |

---

## 📁 Structure du projet

```
src/app/
├── post/
│   ├── index/
│   │   ├── index.component.ts
│   │   └── index.component.html
│   ├── create/
│   │   ├── create.component.ts
│   │   └── create.component.html
│   ├── edit/
│   │   ├── edit.component.ts
│   │   └── edit.component.html
│   ├── view/
│   │   ├── view.component.ts
│   │   └── view.component.html
│   ├── post.service.ts
│   └── post.ts
├── app.routes.ts
├── app.config.ts
├── app.component.ts
└── app.html
```

---

## ⚙️ Étapes de création

### Étape 1 — Créer le projet Angular

```bash
ng new post-pages-crud
cd post-pages-crud
```

---

### Étape 2 — Installer Bootstrap

```bash
npm install bootstrap --save
```

Ajouter dans `angular.json` :

```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.css"
]
```

---

### Étape 3 — Créer le module Post

```bash
ng generate module post
```

Crée : `src/app/post/post.module.ts`

---

### Étape 4 — Créer les composants

```bash
ng generate component post/index
ng generate component post/view
ng generate component post/create
ng generate component post/edit
```

Crée :
```
src/app/post/index/*
src/app/post/view/*
src/app/post/create/*
src/app/post/edit/*
```

---

### Étape 5 — Configurer les routes

`src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { IndexComponent } from './post/index/index.component';
import { ViewComponent } from './post/view/view.component';
import { CreateComponent } from './post/create/create.component';
import { EditComponent } from './post/edit/edit.component';

export const routes: Routes = [
  { path: '', redirectTo: 'post/index', pathMatch: 'full' },
  { path: 'post', redirectTo: 'post/index', pathMatch: 'full' },
  { path: 'post/index', component: IndexComponent },
  { path: 'post/:postId/view', component: ViewComponent },
  { path: 'post/create', component: CreateComponent },
  { path: 'post/:postId/edit', component: EditComponent }
];
```

---

### Étape 6 — Créer l'interface Post

```bash
ng generate interface post/post
```

`src/app/post/post.ts`

```typescript
export interface Post {
  id: number;
  title: string;
  body: string;
}
```

---

### Étape 7 — Créer le service

```bash
ng generate service post/post
```

`src/app/post/post.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Post } from './post';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiURL = 'https://jsonplaceholder.typicode.com';
  private localPosts: Post[] = [];
  private updatedPosts: { [id: number]: Post } = {};
  private deletedIds: number[] = [];

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    }),
  };

  constructor(private httpClient: HttpClient) {
    const saved = localStorage.getItem('localPosts');
    this.localPosts = saved ? JSON.parse(saved) : [];

    const savedUpdates = localStorage.getItem('updatedPosts');
    this.updatedPosts = savedUpdates ? JSON.parse(savedUpdates) : {};

    const savedDeleted = localStorage.getItem('deletedIds');
    this.deletedIds = savedDeleted ? JSON.parse(savedDeleted) : [];
  }

  getAll(): Observable<any> {
    return this.httpClient.get<Post[]>(this.apiURL + '/posts', this.httpOptions).pipe(
      map(posts => {
        const merged = posts
          .filter(p => !this.deletedIds.includes(Number(p.id)))
          .map(p => this.updatedPosts[Number(p.id)] ? this.updatedPosts[Number(p.id)] : p);
        const localFiltered = this.localPosts.filter(p => !this.deletedIds.includes(Number(p.id)));
        return [...merged, ...localFiltered];
      }),
      catchError(this.errorHandler)
    );
  }

  create(post: Post): Observable<any> {
    return this.httpClient.post(this.apiURL + '/posts', JSON.stringify(post), this.httpOptions).pipe(
      map((res: any) => {
        const maxLocal = this.localPosts.length > 0
          ? Math.max(...this.localPosts.map(p => p.id))
          : 0;
        const newId = Math.max(100, maxLocal) + 1;
        const newPost = { ...post, id: newId };
        this.localPosts.push(newPost);
        localStorage.setItem('localPosts', JSON.stringify(this.localPosts));
        return newPost;
      }),
      catchError(this.errorHandler)
    );
  }

  find(id: number): Observable<any> {
    const localPost = this.localPosts.find(p => Number(p.id) == Number(id));
    if (localPost) return new Observable(obs => { obs.next(localPost); obs.complete(); });

    return this.httpClient.get<Post>(this.apiURL + '/posts/' + id).pipe(
      map(p => this.updatedPosts[Number(p.id)] ? this.updatedPosts[Number(p.id)] : p),
      catchError(this.errorHandler)
    );
  }

  update(id: number, post: Post): Observable<any> {
    return this.httpClient.put(this.apiURL + '/posts/' + id, JSON.stringify(post), this.httpOptions).pipe(
      map((res: any) => {
        const numId = Number(id);
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
    );
  }

  delete(id: number) {
    const numId = Number(id);
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
    );
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
```

---

### Étape 8 — Mettre à jour les composants

#### 1. Liste des posts

`src/app/post/index/index.component.ts`

```typescript
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Post } from '../post';
import { PostService } from '../post.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent implements OnInit {
  posts: Post[] = [];
  paginatedPosts: Post[] = [];
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 0;

  constructor(public postService: PostService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.postService.getAll().subscribe((data: Post[]) => {
      this.posts = data || [];
      this.totalPages = Math.ceil(this.posts.length / this.pageSize);
      this.updatePage();
      this.cdr.detectChanges();
    });
  }

  updatePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedPosts = this.posts.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  deletePost(id: number) {
    this.postService.delete(id).subscribe(res => {
      this.posts = this.posts.filter(item => item.id !== id);
      this.totalPages = Math.ceil(this.posts.length / this.pageSize);
      if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
      this.updatePage();
    });
  }
}
```

`src/app/post/index/index.component.html`

```html
<div class="container">
  <h1>Angular 19 CRUD Example - ItSolutionStuff.com</h1>

  <a routerLink="/post/create/" class="btn btn-success mb-3">Create New Post</a>

  <table class="table table-striped">
    <thead>
      <tr>
        <th>ID</th>
        <th>Title</th>
        <th>Body</th>
        <th width="250px">Action</th>
      </tr>
    </thead>
    <tbody>
      @for (post of paginatedPosts; track post.id) {
        <tr>
          <td>{{ post.id }}</td>
          <td>{{ post.title }}</td>
          <td>{{ post.body }}</td>
          <td>
            <a [routerLink]="['/post/', post.id, 'view']" class="btn btn-info btn-sm">View</a>
            <a [routerLink]="['/post/', post.id, 'edit']" class="btn btn-primary btn-sm">Edit</a>
            <button type="button" (click)="deletePost(post.id)" class="btn btn-danger btn-sm">Delete</button>
          </td>
        </tr>
      }
    </tbody>
  </table>

  <nav>
    <ul class="pagination justify-content-center">
      <li class="page-item" [class.disabled]="currentPage === 1">
        <a class="page-link" (click)="goToPage(currentPage - 1)">«</a>
      </li>
      @for (page of getPages(); track page) {
        <li class="page-item" [class.active]="page === currentPage">
          <a class="page-link" (click)="goToPage(page)">{{ page }}</a>
        </li>
      }
      <li class="page-item" [class.disabled]="currentPage === totalPages">
        <a class="page-link" (click)="goToPage(currentPage + 1)">»</a>
      </li>
    </ul>
  </nav>

  <p class="text-center text-muted">
    Page {{ currentPage }} / {{ totalPages }} — {{ posts.length }} posts au total
  </p>
</div>
```

---

#### 2. Créer un post

`src/app/post/create/create.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostService } from '../post.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css',
})
export class CreateComponent implements OnInit {
  form!: FormGroup;

  constructor(public postService: PostService, private router: Router) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      title: new FormControl('', [Validators.required]),
      body: new FormControl('', Validators.required),
    });
  }

  get f() {
    return this.form.controls;
  }

  submit() {
    this.postService.create(this.form.value).subscribe((res: any) => {
      console.log('Post created successfully!');
      this.router.navigateByUrl('post/index');
    });
  }
}
```

`src/app/post/create/create.component.html`

```html
<div class="container">
  <h1>Create New Post</h1>

  <a routerLink="/post/index" class="btn btn-primary">Back</a>

  <form [formGroup]="form" (ngSubmit)="submit()">
    <div class="form-group">
      <label for="title">Title:</label>
      <input formControlName="title" id="title" type="text" class="form-control">
      @if (f['title'].touched && f['title'].invalid) {
        <div class="alert alert-danger">
          @if (f['title'].errors && f['title'].errors['required']) {
            Title is required.
          }
        </div>
      }
    </div>

    <div class="form-group">
      <label for="body">Body</label>
      <textarea formControlName="body" id="body" type="text" class="form-control"></textarea>
      @if (f['body'].touched && f['body'].invalid) {
        <div class="alert alert-danger">
          @if (f['body'].errors && f['body'].errors['required']) {
            Body is required.
          }
        </div>
      }
    </div>

    <button class="btn btn-primary" type="submit" [disabled]="!form.valid">Submit</button>
  </form>
</div>
```

---

#### 3. Modifier un post

`src/app/post/edit/edit.component.ts`

```typescript
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../post';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { PostService } from '../post.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.css',
})
export class EditComponent implements OnInit {
  id!: number;
  post!: Post;
  form!: FormGroup;

  constructor(
    public postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.params['postId'];

    this.form = new FormGroup({
      title: new FormControl('', [Validators.required]),
      body: new FormControl('', [Validators.required]),
    });

    this.postService.find(this.id).subscribe((data: Post) => {
      this.post = data;
      this.form.patchValue({ title: data.title, body: data.body });
      this.cdr.detectChanges();
    });
  }

  get f() {
    return this.form.controls;
  }

  submit() {
    this.postService.update(this.id, this.form.value).subscribe((res: any) => {
      console.log('Post updated successfully!');
      this.router.navigateByUrl('/post/index');
    });
  }
}
```

`src/app/post/edit/edit.component.html`

```html
<div class="container">
  <h1>Update Post</h1>

  <a routerLink="/post/index" class="btn btn-primary">Back</a>

  <form [formGroup]="form" (ngSubmit)="submit()">
    <div class="form-group">
      <label for="title">Title:</label>
      <input formControlName="title" id="title" type="text" class="form-control">
      @if (f['title'].touched && f['title'].invalid) {
        <div class="alert alert-danger">
          @if (f['title'].errors && f['title'].errors['required']) {
            Title is required.
          }
        </div>
      }
    </div>

    <div class="form-group">
      <label for="body">Body</label>
      <textarea formControlName="body" id="body" type="text" class="form-control"></textarea>
      @if (f['body'].touched && f['body'].invalid) {
        <div class="alert alert-danger">
          @if (f['body'].errors && f['body'].errors['required']) {
            Body is required.
          }
        </div>
      }
    </div>

    <button class="btn btn-primary" type="submit" [disabled]="!form.valid">Update</button>
  </form>
</div>
```

---

#### 4. Voir un post

`src/app/post/view/view.component.ts`

```typescript
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../post';
import { PostService } from '../post.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view.component.html',
  styleUrl: './view.component.css',
})
export class ViewComponent implements OnInit {
  id!: number;
  post!: Post;

  constructor(
    public postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.params['postId'];
    this.postService.find(this.id).subscribe((data: Post) => {
      this.post = data;
      this.cdr.detectChanges();
    });
  }
}
```

`src/app/post/view/view.component.html`

```html
<div class="container">
  <h1>View Post</h1>

  <a routerLink="/post/index" class="btn btn-primary">Back</a>

  @if (post) {
    <div>
      <strong>ID:</strong>
      <p>{{ post.id }}</p>
    </div>
    <div>
      <strong>Title:</strong>
      <p>{{ post.title }}</p>
    </div>
    <div>
      <strong>Body:</strong>
      <p>{{ post.body }}</p>
    </div>
  }
</div>
```

---

### Étape 9 — Configurer provideHttpClient()

`src/app/app.config.ts`

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient()
  ]
};
```

`src/app/app.html`

```html
<router-outlet></router-outlet>
```

---

### Étape 10 — Lancer l'application

```bash
ng serve
```

Ouvrir dans le navigateur : [http://localhost:4200/post/index](http://localhost:4200/post/index)

---

## 🔗 Routes

| Route | Composant | Description |
|---|---|---|
| `/post/index` | `IndexComponent` | Liste des posts |
| `/post/create` | `CreateComponent` | Créer un post |
| `/post/:id/view` | `ViewComponent` | Voir un post |
| `/post/:id/edit` | `EditComponent` | Modifier un post |

---

## 🌐 API utilisée

[JSONPlaceholder](https://jsonplaceholder.typicode.com) — fausse API REST pour les tests.

| Méthode | Endpoint | Action |
|---|---|---|
| GET | `/posts` | Récupérer tous les posts |
| GET | `/posts/:id` | Récupérer un post |
| POST | `/posts` | Créer un post |
| PUT | `/posts/:id` | Modifier un post |
| DELETE | `/posts/:id` | Supprimer un post |

> ⚠️ JSONPlaceholder simule les requêtes mais ne persiste rien côté serveur. La persistance est gérée localement via `localStorage`.

---

## 💾 Persistance locale (localStorage)

| Clé | Contenu |
|---|---|
| `localPosts` | Posts créés localement |
| `updatedPosts` | Posts modifiés |
| `deletedIds` | IDs des posts supprimés |

---

## 🐛 Problèmes résolus

- Remplacement de `*ngFor` / `*ngIf` par `@for` / `@if` (Angular 17+)
- Ajout de `ChangeDetectorRef.detectChanges()` pour forcer le re-render
- Gestion du cache HTTP (headers `Cache-Control: no-cache`)
- Cast `Number()` pour éviter les mismatches string/number sur les IDs
- `patchValue()` pour pré-remplir le formulaire d'édition
- `RouterModule` manquant dans les standalone components
- Suppression de `[(ngModel)]` incompatible avec `formControlName`
- Opérateur `&` remplacé par `&&` dans les conditions

---

## 👨‍💻 Auteur

**Abdelhak Amzil**
[GitHub](https://github.com/AbdelhakAmzil) • [Portfolio](https://abdelhakamzil.github.io) • [LinkedIn](https://linkedin.com/in/abdelhak-amzil)
