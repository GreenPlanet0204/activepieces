import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from '@activepieces/ui/common';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/shell/shell';
import 'codemirror/addon/display/autorefresh';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/javascript-lint';
import jsonlint from 'codemirror/addon/lint/json-lint';
import { JSHINT } from './app/jshint/jshint';
(<any>window).JSHINT = JSHINT;
(<any>window).jsonlint = jsonlint;
if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
