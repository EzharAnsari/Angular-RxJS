import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { BehaviorSubject, catchError, combineLatest, from, map, merge, Observable, of, Subject, tap, throwError } from 'rxjs';
import { filter, mergeMap, scan, shareReplay, switchMap, toArray } from 'rxjs/operators'

import { Product } from './product';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { SupplierService } from '../suppliers/supplier.service';
import { Supplier } from '../suppliers/supplier';
import { JsonPipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = 'api/suppliers';

  products$ = this.http.get<Product[]>(this.productsUrl)
  .pipe(
    tap(data => console.log('Products: ', JSON.stringify(data))),
    shareReplay(1),
    catchError(this.handleError)
  );

  productWithCategory$ = combineLatest([
    this.products$,
    this.productCategorySerice.productCategories$
  ]).pipe(
    map(([ products, categories ]) => 
      products.map(product => ({
        ... product,
        price: product.price ? product.price * 1.5 : 0,
        category: categories.find(c => c.id === product.categoryId)?.name,
        searchKey: [product.productName]
      }) as Product),
      shareReplay(1)
    )
  );

  private selectedProductIdSubject = new BehaviorSubject<number>(0);
  selectedProductIdAction$ = this.selectedProductIdSubject.asObservable();

  selectedProduct$ = combineLatest([
    this.productWithCategory$,
    this.selectedProductIdAction$
  ])
    .pipe(
      map(([products, selectedProdId]) => 
        products.find(product => product.id === selectedProdId)
      ),
      shareReplay(1),
      tap(product => console.log('selectedProduct', product))
    );

  // selectedProductSuppliers$ = combineLatest(
  //   this.selectedProduct$,
  //   this.supplierService.supliers$
  // ).pipe(
  //   map(([product, suppliers]) => 
  //     suppliers.filter(sup => product?.supplierIds?.includes(sup.id))
  //   )
  // )

  selectedProductSuppliers$ = this.selectedProduct$
    .pipe(
      filter(selectedProduct => Boolean(selectedProduct)),
      switchMap(selectedProduct => {
        const ids = selectedProduct?.supplierIds ? selectedProduct.supplierIds : []; 
        return from(ids)
          .pipe(
            mergeMap(supplierId => this.http.get<Supplier>(`${this.suppliersUrl}/${supplierId}`)),
            toArray(),
            tap(data => console.log('product suppliers data', JSON.stringify(data)))
          )
        })
    )

  private productInsertSubject = new Subject<Product>();
  productInsertAction$ = this.productInsertSubject.asObservable();

  productAddItem$ = merge(
    this.productWithCategory$,
    this.productInsertAction$.pipe(map(product => [product]))
  ).pipe(
    scan((acc: Product[], value: Product[]) => [...acc, ...value])
  );
  
  constructor(private http: HttpClient, private productCategorySerice: ProductCategoryService, private supplierService: SupplierService) { }

  private fakeProduct(): Product {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      // category: 'Toolbox',
      quantityInStock: 30
    };
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.message}`;
    }
    console.error(err);
    return throwError(() => errorMessage);
  }

  updateProductId(value: number): void  {
    this.selectedProductIdSubject.next(value);
  }

  addProduct(newProduct?: Product) {
    newProduct = newProduct || this.fakeProduct();
    this.productInsertSubject.next(newProduct);
  }

}
