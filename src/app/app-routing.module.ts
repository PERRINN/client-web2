import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { ChatComponent } from './chat.component';
import { ChatModalComponent } from './chatModal.component';
import { TeamProfileComponent } from './teamProfile.component';
import { TeamSettingsComponent } from './teamSettings.component';
import { SearchComponent } from './search.component';
import { SendCoinsComponent } from './sendCoins.component';
import { BuyCoinsComponent } from './buyCoins.component';

const appRoutes: Routes = [
  { path: 'chat/:id', component: ChatComponent },
  { path: 'team/:id', component: TeamProfileComponent },
  { path: 'teamSettings/:id', component: TeamSettingsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'search', component: SearchComponent },
  { path: 'sendCoins', component: SendCoinsComponent },
  { path: 'buyCoins', component: BuyCoinsComponent },
  { path: '',   redirectTo: '/login', pathMatch: 'full' },
  { path: '**', component: LoginComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
