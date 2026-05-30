import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';

import {Post} from '../post';
import {ReactiveFormsModule, FormControl, FormGroup, Validators} from '@angular/forms';
import {PostService} from '../post.service';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.css',
})
export class EditComponent implements OnInit{

  id!: number;
  post!: Post;
  form!: FormGroup;

  /*------------------------------------------
 --------------------------------------------
 Created constructor
 --------------------------------------------
 --------------------------------------------*/
  constructor(
    public postService: PostService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  /**
   * Write code on Method
   *
   * @return response()
   */
  ngOnInit(): void {
    this.id = this.route.snapshot.params['postId'];

    this.form = new FormGroup({
      title: new FormControl('', [Validators.required]),
      body: new FormControl('', [Validators.required])
    });

    this.postService.find(this.id).subscribe((data: Post) => {
      this.post = data;
      this.form.patchValue({           // ← pré-remplit le formulaire
        title: data.title,
        body: data.body
      })
    });
  }

  /**
   * Write code on Method
   *
   * @return response()
   */
  get f(){
    return this.form.controls;
  }

  /**
   * Write code on Method
   *
   * @return response()
   */
  submit(){
    console.log(this.form.value);
    this.postService.update(this.id, this.form.value).subscribe((res:any) => {
      console.log('Post successfully updated!');
      this.router.navigateByUrl('/post/index');
    })
  }
}
