import { registerLocaleData } from '@angular/common'
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http'
import localeZhHans from '@angular/common/locales/zh-Hans'
import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { I18NService } from '@core/i18n/i18n.service'
import { DefaultInterceptor } from '@core/net/default.interceptor'
import { StartupService } from '@core/startup/startup.service'
import { SimpleInterceptor } from '@delon/auth'
import { ALAIN_I18N_TOKEN } from '@delon/theme'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { JsonSchemaModule } from '@shared/json-schema/json-schema.module'

import { AppComponent } from './app.component'
import { CoreModule } from './core/core.module'
import { DelonModule } from './delon.module'
import { LayoutModule } from './layout/layout.module'
import { RoutesModule } from './routes/routes.module'
import { SharedModule } from './shared/shared.module'

// angular i18n
registerLocaleData(localeZhHans)
// i18n
// 加载i18n语言文件
export function I18nHttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, `assets/tmp/i18n/`, '.json')
}

// @delon/form: JSON Schema form
export function StartupServiceFactory(startupService: StartupService): Function {
  return () => startupService.load()
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    DelonModule.forRoot(),
    CoreModule,
    SharedModule,
    LayoutModule,
    RoutesModule,
    // i18n
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: I18nHttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    // JSON-Schema form
    JsonSchemaModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'zh-Hans' },
    { provide: HTTP_INTERCEPTORS, useClass: SimpleInterceptor, multi: true},
    { provide: HTTP_INTERCEPTORS, useClass: DefaultInterceptor, multi: true},
    { provide: ALAIN_I18N_TOKEN, useClass: I18NService, multi: false },
    StartupService,
    {
      provide: APP_INITIALIZER,
      useFactory: StartupServiceFactory,
      deps: [StartupService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
