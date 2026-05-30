import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {Post} from '../post';
import {PostService} from '../post.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent implements OnInit{

  posts: Post [] = [];
  paginatedPosts: Post[] = [];
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 0;

  /*------------------------------------------
  --------------------------------------------
  Created constructor
  --------------------------------------------
  --------------------------------------------*/
  constructor(public postService: PostService, private cdr: ChangeDetectorRef) {}

  /**
   * Write code on Method
   *
   * @return response()
   */
  ngOnInit(): void {
    this.postService.getAll().subscribe((data: Post[]) => {
      this.posts = data || [];
      this.totalPages = Math.ceil(this.posts.length / this.pageSize);
      this.updatePage();
      this.cdr.detectChanges();
    })
  }

  updatePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedPosts = this.posts.slice(start, end);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  /**
   * Write code on Method
   *
   * @return response()
   */
  deletePost(id: number) {
    this.postService.delete(id).subscribe(res => {
      this.posts = this.posts.filter(item => item.id !== id);
      this.totalPages = Math.ceil(this.posts.length / this.pageSize);
      if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
      this.updatePage();
    })
  }
}
