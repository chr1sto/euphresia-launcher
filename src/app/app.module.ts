import 'reflect-metadata';
import '../polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ElectronService } from './providers/electron.service';

import { WebviewDirective } from './directives/webview.directive';

import { AppComponent } from './app.component';
import { HomeComponent } from './home.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuardService } from './guards/auth-guard';
import { AuthenticationService } from './services/auth.service';
import { AccountService, API_BASE_URL, GameAccountService } from './services/generated.services';
import { JwtInterceptor, JwtHelperService, JwtModule } from '@auth0/angular-jwt';
import { RegisterComponent } from './components/register/register.component';
import { IniService } from './services/ini.service';
import { SelectAccountService } from './services/select-account.service';
import { ModalService } from './services/modal.service';
import { ModalComponent } from './components/modal/modal.component';
import { SettingsComponent } from './components/home/settings/settings.component';
import { SelectAccountComponent } from './components/select-account/select-account.component';
import { SliderComponent } from './components/home/slider/slider.component';
import {SlideshowModule} from 'ng-simple-slideshow';
import { InteropService } from './services/interop.service';
import { FileSizePipe } from './pipes/file-size.pipe';
import { DebugComponent } from './components/home/debug/debug.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export class AppConsts
{
  static baseUrl = "https://api.euphresia-flyff.com/api"
}

export function getBaseUrl() : string {
  return AppConsts.baseUrl
}

export function getToken(): string {
  return localStorage.getItem('token');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    WebviewDirective,
    LoginComponent,
    RegisterComponent,
    ModalComponent,
    SettingsComponent,
    SelectAccountComponent,
    SliderComponent,
    DebugComponent,
    FileSizePipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    SlideshowModule,
    HttpClientModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      }
    }),
    JwtModule.forRoot({
      config: {
          tokenGetter: getToken
      }
  })
  ],
  providers: [
    {provide: API_BASE_URL,useFactory: getBaseUrl},
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true},
    ElectronService,
    AuthGuardService,
    AuthenticationService,
    AccountService,
    JwtHelperService,
    GameAccountService,
    IniService,
    SelectAccountService,
    ModalService,
    InteropService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
