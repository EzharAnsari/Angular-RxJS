import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BehaviorSubject, catchError, combineLatest, EMPTY, map, startWith, Subject } from 'rxjs';

import { ProductService } from './product.service';
import { ProductCategoryService } from '../product-categories/product-category.service';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent {
  pageTitle = 'Product List';
  errorMessage = '';
  
  // private categorySelectedSubject = new BehaviorSubject<number>(0);
  private categorySelectedSubject = new Subject<number>();
  categorySelectedAction$ = this.categorySelectedSubject.asObservable();

  categories$ = this.productCategoryService.productCategories$
    .pipe(
      catchError(err => {
        this.errorMessage = err;
        return EMPTY;
      })
    );

  products$ = combineLatest([
    this.productService.productWithCategory$,
    this.categorySelectedAction$
      .pipe(
        startWith(0)
      )
  ]) 
  .pipe(
    map( ([products, selectedCategoryId]) => 
      products.filter(product => selectedCategoryId ? product.categoryId === selectedCategoryId : true)
    ),
    catchError( err => {
      this.errorMessage = err;
      // return of([]);
      return EMPTY;
    })
  );

  constructor(private productService: ProductService, private productCategoryService: ProductCategoryService) {}

  onAdd(): void {
    console.log('Not yet implemented');
  }

  onSelected(categoryId: string): void {
    this.categorySelectedSubject.next(+categoryId);
  }
}
