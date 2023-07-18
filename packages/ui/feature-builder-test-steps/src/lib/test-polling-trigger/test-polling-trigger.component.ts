import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import deepEqual from 'deep-equal';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { ActivepiecesError, TriggerType } from '@activepieces/shared';
import { TestStepCoreComponent } from '../test-steps-core.component';
import { TestStepService } from '@activepieces/ui/common';
import { BuilderSelectors, FlowsActions } from '@activepieces/ui/feature-builder-store';
export interface PollingHistoricalData {
  payload: unknown;
  created: string;
}
@Component({
  selector: 'app-test-polling-trigger',
  templateUrl: './test-polling-trigger.component.html',
})
export class TestPollingTriggerComponent extends TestStepCoreComponent {
  currentResults$: BehaviorSubject<PollingHistoricalData[]>;
  saveAfterNewDataIsLoaded$: Observable<void>;
  saveNewSelectedData$: Observable<void>;
  selectedDataControl: FormControl<unknown> = new FormControl();
  initialHistoricalData$: Observable<PollingHistoricalData[]>;
  initaillySelectedSampleData$: Observable<unknown>;
  testStep$: Observable<PollingHistoricalData[]>;
  loading = false;
  failed = false;
  hasBeenTested = false;
  isValid$: Observable<boolean>;
  constructor(testStepService: TestStepService, private store: Store) {
    super(testStepService);
    this.isValid$ = this.store.select(BuilderSelectors.selectStepValidity);
    this.initialObservables();
  }
  private initialObservables() {
    this.saveNewSelectedData$ = this.selectedDataControl.valueChanges.pipe(
      tap(() => {
        this.saveNewResultToStep();
      }),
      map(() => void 0)
    );
    this.initialHistoricalData$ = this.store
      .select(BuilderSelectors.selectCurrentFlowId)
      .pipe(
        take(1),
        switchMap((res) => {
          return this.testStepService.getTriggerEventsResults(res?.toString() || '');
        }),
        map((res) => {
          return res.data;
        }),
        tap((res) => {
          this.currentResults$ = new BehaviorSubject<PollingHistoricalData[]>(
            res
          );
        })
      );
    this.initaillySelectedSampleData$ = this.store
      .select(BuilderSelectors.selectStepSelectedSampleData)
      .pipe(
        take(1),
        tap((res) => {
          this.selectedDataControl.setValue(res);
          this.setSelectedDataControlListener();
        })
      );
  }
  private setSelectedDataControlListener() {
    this.saveNewSelectedData$ = this.selectedDataControl.valueChanges.pipe(
      tap(() => {
        this.saveNewResultToStep();
      }),
      map(() => void 0)
    );
  }
  testStep() {
    this.loading = true;
    this.failed = false;
    this.hasBeenTested = true;
    this.testStep$ = this.store
      .select(BuilderSelectors.selectCurrentFlowId)
      .pipe(
        take(1),
        switchMap((id) => {
          if (id) {
            return this.testStepService.getPollingResults(id.toString()).pipe(
              tap((res) => {
                this.loading = false;
                this.currentResults$.next(res.data);
                if (res.data.length > 0)
                  this.selectedDataControl.setValue(res.data[0].payload);
                this.testStepService.elevateResizer$.next(true);
              }),
              map((res) => res.data),
              catchError((e: ActivepiecesError) => {
                console.error(e);
                this.loading = false;
                this.failed = true;
                this.currentResults$.next([]);
                this.testStepService.elevateResizer$.next(true);
                return of([]);
              })
            );
          }
          return of([]);
        })
      );
  }
  saveNewResultToStep() {
    this.saveAfterNewDataIsLoaded$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        take(1),
        tap((step) => {
          if (step && step.type === TriggerType.PIECE) {
            const clone = { ...step };
            clone.settings = {
              ...clone.settings,
              inputUiInfo: {
                currentSelectedData: this.selectedDataControl.value,
              },
            };
            this.store.dispatch(
              FlowsActions.updateTrigger({
                operation: clone,
              })
            );
          }
        }),
        map(() => void 0)
      );
  }
  dropdownCompareWithFunction = (opt: unknown, formControlValue: unknown) => {
    return formControlValue !== undefined && deepEqual(opt, formControlValue);
  };
}
