import { Component, OnInit ,OnDestroy,Inject} from '@angular/core';
import { I_CURRENCY_API_SERVICE } from '../../../core/interfaces/currency-api.service.token';
import { ICurrencyApiService } from '../../../core/interfaces/currency-api.service.interface';
import { Store } from '@ngrx/store';
import { ActionInitCurrencyCatalog, selectorPageSize, selectorSelectedPage, ActionUpdateSelectedPage, SelectorCurrenciesData } from '../../../core/reducers/currency-catalog.reducer';
import { Subject } from 'rxjs/internal/Subject';
import { switchMap , takeUntil, combineLatest , debounceTime} from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { Currency } from 'src/public/common/models/currency.model';
import { DEFAULT_SELECTED_PAGE, DEFAULT_SIZE_PAGE } from '../../../common/constants/config';
 
@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit  , OnDestroy{
  private unsubscribe$: Subject<void> = new Subject<void>();
  public pageSize$ :BehaviorSubject<number> = new BehaviorSubject(DEFAULT_SIZE_PAGE);
  public selectedPage$ :BehaviorSubject<number> = new BehaviorSubject(DEFAULT_SELECTED_PAGE);
  public currenciesData$ : BehaviorSubject<Currency[]>= new BehaviorSubject([]);

  constructor(
    @Inject(I_CURRENCY_API_SERVICE) public currencyService: ICurrencyApiService,
    public store: Store<any>,
  ) {}

  ngOnInit() {
    this.store.pipe(takeUntil(this.unsubscribe$)).subscribe(storeInfo=>{
      let pageSize = storeInfo && storeInfo.currencyCatalog && storeInfo.currencyCatalog.pageSize || DEFAULT_SIZE_PAGE ;
      let selectedPage = storeInfo && storeInfo.currencyCatalog && storeInfo.currencyCatalog.selectedPage || DEFAULT_SELECTED_PAGE;
      if(this.pageSize$.getValue() !== pageSize){
        this.pageSize$.next(pageSize);
      }
      if(this.selectedPage$.getValue() !== selectedPage){
        this.selectedPage$.next(selectedPage);
      }
      let currenciesData  = storeInfo && storeInfo.currencyCatalog && storeInfo.currencyCatalog.data || [] ;
      this.currenciesData$.next(currenciesData);
    })
    
    
    this.pageSize$.pipe(
      combineLatest(this.selectedPage$),
      debounceTime(100),
      switchMap((pageConfig) =>{
        let pageSize = pageConfig[0];
        let selectedPage =  pageConfig[1];
        return this.currencyService.getCurrencies(pageSize , selectedPage)
      }
      ),takeUntil(this.unsubscribe$)
    ).subscribe(res=>{
      this.store.dispatch(new ActionInitCurrencyCatalog(
        Object.assign({pageSize : this.pageSize$.getValue() , selectedPage: this.selectedPage$.getValue()}, res
        )));
    })
  }

  
  ngOnDestroy(){
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
