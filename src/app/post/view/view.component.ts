import {Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {Post} from '../post';
import {PostService} from '../post.service';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

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

  /*------------------------------------------
  --------------------------------------------
  Created constructor
  --------------------------------------------
  --------------------------------------------*/
  constructor(
    public postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef  // ← ajouté
  ) { }

  /**
   * Write code on Method
   *
   * @return response()
   */
  ngOnInit(): void {
    this.id = this.route.snapshot.params['postId'];
    console.log('ID récupéré:', this.id, typeof this.id);

    this.postService.find(this.id).subscribe((data: Post)=>{
      console.log('Post reçu:', data);
      this.post = data;
      this.cdr.detectChanges();  // ← force le re-render
    });
  }
}
