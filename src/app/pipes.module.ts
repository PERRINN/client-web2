import {NgModule} from '@angular/core'
import {BlankIfZeroPipe} from './pipes';

 @NgModule({
     imports:        [],
     declarations:   [BlankIfZeroPipe],
     exports:        [BlankIfZeroPipe],
 })

export class PipeModule {
   static forRoot() {
     return {
        ngModule: PipeModule,
        providers: [],
      };
   }
 }
