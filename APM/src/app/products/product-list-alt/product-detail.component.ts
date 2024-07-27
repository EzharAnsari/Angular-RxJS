import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Supplier } from '../../suppliers/supplier';
import { Product } from '../product';

import { ProductService } from '../product.service';
import { catchError, combineLatest, EMPTY, Subject } from 'rxjs';
import {filter, map} from 'rxjs/operators'

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent {
  private errorMessageSubject = new Subject<string>();
  errorMessage$ = this.errorMessageSubject.asObservable();

  // productSuppliers: Supplier[] | null = null;

  product$ = this.productService.selectedProduct$
    .pipe(
      catchError(err => {
        this.errorMessageSubject.next(err);
        return EMPTY;
      })
    );

    pageTitle$ = this.product$
      .pipe(
        map((p) => 
          p ? `Product Details for: ${p.productName}` : null
        )
      )

    productSuppliers$ = this.productService.selectedProductSuppliers$
      .pipe(
        catchError(err => {
          this.errorMessageSubject.next(err);
          return EMPTY
        })
      )

    vm$ = combineLatest(
      this.product$,
      this.pageTitle$,
      this.productSuppliers$
    ).pipe(
      filter(([product]) => Boolean(product)),
      map(([product, pageTitle, productSuppliers]) => 
      ({product, pageTitle, productSuppliers}))
    )

  constructor(private productService: ProductService) { }

}
