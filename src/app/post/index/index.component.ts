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
  ngOnInit():void {
    this.postService.getAll().subscribe((data: Post[])=>{
      this.posts = data || [];
      this.cdr.detectChanges();
      console.log(this.posts);
    })
  }

  /**
   * Write code on Method
   *
   * @return response()
   */
  deletePost(id:number){
    this.postService.delete(id).subscribe(res=>{
      this.posts = this.posts.filter(item => item.id != id);
      console.log('Post deleted successfully!');
    })
  }
}
