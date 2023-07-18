import { Store } from '@ngrx/store';
import {
  combineLatest,
  forkJoin,
  map,
  Observable,
  startWith,
  take,
  tap,
} from 'rxjs';

import { Component, Input, OnInit } from '@angular/core';
import {
  Trigger,
  ActionType,
  TriggerType,
  AddActionRequest,
  FlowVersion,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { FormControl } from '@angular/forms';
import {
  BuilderSelectors,
  CodeService,
  FlowsActions,
  FlowStructureUtil,
  NO_PROPS,
  RightSideBarType,
  StepTypeSideBarProps,
} from '@activepieces/ui/feature-builder-store';
import {
  FlowItemDetails,
  getDefaultDisplayNameForPiece,
  getDisplayNameForTrigger,
} from '@activepieces/ui/common';

@Component({
  selector: 'app-step-type-sidebar',
  templateUrl: './step-type-sidebar.component.html',
  styleUrls: ['./step-type-sidebar.component.scss'],
})
export class StepTypeSidebarComponent implements OnInit {
  _showTriggers = false;
  searchFormControl = new FormControl('');
  @Input() set showTriggers(shouldShowTriggers: boolean) {
    this._showTriggers = shouldShowTriggers;
    if (this._showTriggers) {
      this.sideBarDisplayName = 'Select Trigger';
    } else {
      this.sideBarDisplayName = 'Select Step';
    }
    this.populateTabsAndTheirLists();
  }

  sideBarDisplayName = 'Select Step';
  tabsAndTheirLists: {
    displayName: string;
    list$: Observable<FlowItemDetails[]>;
    emptyListText: string;
  }[] = [];
  flowTypeSelected$: Observable<void>;
  flowItemDetailsLoaded$: Observable<boolean>;
  triggersDetails$: Observable<FlowItemDetails[]>;
  constructor(private store: Store, private codeService: CodeService) {}

  ngOnInit(): void {
    this.flowItemDetailsLoaded$ = this.store
      .select(BuilderSelectors.selectAllFlowItemsDetailsLoadedState)
      .pipe(tap(console.log));
  }

  populateTabsAndTheirLists() {
    this.searchFormControl.setValue('', { emitEvent: false });
    this.tabsAndTheirLists = [];
    const coreItemsDetails$ = this._showTriggers
      ? this.store.select(BuilderSelectors.selectFlowItemDetailsForCoreTriggers)
      : this.store.select(BuilderSelectors.selectCoreFlowItemsDetails);
    const customPiecesItemDetails$ = this._showTriggers
      ? this.store.select(
          BuilderSelectors.selectFlowItemDetailsForCustomPiecesTriggers
        )
      : this.store.select(
          BuilderSelectors.selectFlowItemDetailsForCustomPiecesActions
        );

    const allItemDetails$ = forkJoin({
      apps: customPiecesItemDetails$.pipe(take(1)),
      core: coreItemsDetails$.pipe(take(1)),
    }).pipe(
      map((res) => {
        return [...res.core, ...res.apps];
      })
    );
    this.tabsAndTheirLists.push({
      displayName: 'All',
      list$: this.applySearchToObservable(allItemDetails$),
      emptyListText: "Oops! We didn't find any results.",
    });

    this.tabsAndTheirLists.push({
      displayName: 'Core',
      list$: this.applySearchToObservable(coreItemsDetails$),
      emptyListText: "Oops! We didn't find any results.",
    });

    this.tabsAndTheirLists.push({
      displayName: this._showTriggers ? 'App Events' : 'App Actions',
      list$: this.applySearchToObservable(customPiecesItemDetails$),
      emptyListText: "Oops! We didn't find any results.",
    });
  }

  closeSidebar() {
    this.store.dispatch(
      FlowsActions.setRightSidebar({
        sidebarType: RightSideBarType.NONE,
        props: NO_PROPS,
      })
    );
  }

  onTypeSelected(flowItemDetails: FlowItemDetails) {
    this.flowTypeSelected$ = forkJoin({
      currentFlow: this.store
        .select(BuilderSelectors.selectCurrentFlow)
        .pipe(take(1)),
      rightSideBar: this.store
        .select(BuilderSelectors.selectCurrentRightSideBar)
        .pipe(take(1)),
    }).pipe(
      take(1),
      tap((results) => {
        if (!results.currentFlow) {
          return;
        }
        if (this._showTriggers) {
          this.replaceTrigger(flowItemDetails);
        } else {
          const operation = this.constructOperation(
            (results.rightSideBar.props as StepTypeSideBarProps).stepName,
            results.currentFlow.version,
            flowItemDetails.type as ActionType,
            flowItemDetails,
            (results.rightSideBar.props as StepTypeSideBarProps)
              .stepLocationRelativeToParent
          );

          this.store.dispatch(
            FlowsActions.addAction({
              operation: operation,
            })
          );
        }
      }),
      map(() => {
        return void 0;
      })
    );
  }

  private replaceTrigger(triggerDetails: FlowItemDetails) {
    const base = {
      name: 'trigger',
      nextAction: undefined,
      displayName: getDisplayNameForTrigger(triggerDetails.type as TriggerType),
    };
    let trigger: Trigger;
    switch (triggerDetails.type as TriggerType) {
      case TriggerType.EMPTY:
        trigger = {
          ...base,
          valid: false,
          type: TriggerType.EMPTY,
          settings: undefined,
        };
        break;
      case TriggerType.WEBHOOK:
        trigger = {
          ...base,
          valid: true,
          type: TriggerType.WEBHOOK,
          settings: {
            inputUiInfo: { currentSelectedData: '' },
          },
        };
        break;
      case TriggerType.PIECE:
        trigger = {
          ...base,
          type: TriggerType.PIECE,
          valid: false,
          settings: {
            pieceName: triggerDetails.extra?.appName || 'NO_APP_NAME',
            pieceVersion: triggerDetails.extra?.appVersion || 'NO_APP_VERSION',
            triggerName: '',
            input: {},
            inputUiInfo: {
              currentSelectedData: '',
            },
          },
        };
        break;
    }
    this.store.dispatch(
      FlowsActions.updateTrigger({
        operation: trigger,
      })
    );
  }

  constructOperation(
    parentStep: string,
    flowVersion: FlowVersion,
    actionType: ActionType,
    flowItemDetails: FlowItemDetails,
    stepLocationRelativeToParent: StepLocationRelativeToParent
  ): AddActionRequest {
    const baseProps = {
      name: FlowStructureUtil.findAvailableName(flowVersion, 'step'),
      displayName: getDefaultDisplayNameForPiece(
        flowItemDetails.type as ActionType,
        flowItemDetails.name
      ),
      nextAction: undefined,
      valid: true,
    };
    switch (actionType) {
      case ActionType.CODE: {
        return {
          parentStep: parentStep,
          stepLocationRelativeToParent: stepLocationRelativeToParent,
          action: {
            ...baseProps,
            type: ActionType.CODE,
            settings: {
              artifact: this.codeService.helloWorldBase64(),
              artifactSourceId: '',
              artifactPackagedId: '',
              input: {},
            },
          },
        };
      }
      case ActionType.LOOP_ON_ITEMS: {
        return {
          parentStep: parentStep,
          stepLocationRelativeToParent: stepLocationRelativeToParent,
          action: {
            ...baseProps,
            type: ActionType.LOOP_ON_ITEMS,
            settings: {
              items: '',
            },
            valid: false,
          },
        };
      }
      case ActionType.PIECE: {
        return {
          parentStep: parentStep,
          stepLocationRelativeToParent: stepLocationRelativeToParent,
          action: {
            ...baseProps,
            type: ActionType.PIECE,
            valid: false,
            settings: {
              pieceName: flowItemDetails.extra?.appName || 'NO_APP_NAME',
              pieceVersion:
                flowItemDetails.extra?.appVersion || 'NO_APP_VERSION',
              actionName: undefined,
              input: {},
              inputUiInfo: {
                customizedInputs: {},
              },
            },
          },
        };
      }
      case ActionType.BRANCH: {
        return {
          parentStep: parentStep,
          stepLocationRelativeToParent: stepLocationRelativeToParent,
          action: {
            ...baseProps,
            valid: false,
            type: ActionType.BRANCH,
            settings: {
              conditions: [
                [
                  {
                    firstValue: '',
                    secondValue: '',
                    operator: undefined,
                  },
                ],
              ],
            },
          },
        };
      }
    }
  }

  applySearchToObservable(
    obs$: Observable<FlowItemDetails[]>
  ): Observable<FlowItemDetails[]> {
    return combineLatest({
      items: obs$,
      search: this.searchFormControl.valueChanges.pipe(
        startWith(''),
        map((search) => (search ? search : ''))
      ),
    }).pipe(
      map((res) => {
        return res.items.filter(
          (item) =>
            item.description
              .toLowerCase()
              .includes(res.search.trim().toLowerCase()) ||
            item.name.toLowerCase().includes(res.search.trim().toLowerCase())
        );
      })
    );
  }
}
