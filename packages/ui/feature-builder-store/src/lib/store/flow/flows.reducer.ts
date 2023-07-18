import { Action, createReducer, on } from '@ngrx/store';
import { FlowsActions } from './flows.action';
import { UUID } from 'angular2-uuid';
import { Flow, flowHelper, FlowOperationType } from '@activepieces/shared';
import { LeftSideBarType } from '../../model/enums/left-side-bar-type.enum';
import { RightSideBarType } from '../../model/enums/right-side-bar-type.enum';
import { NO_PROPS, TabState } from '../../model/tab-state';
import { FlowItem } from '../../model/flow-item';

type FlowsState = {
  flows: Flow[];
  tabsState: { [key: string]: TabState };
  selectedFlowId: UUID;
};

const initialState: FlowsState = {
  flows: [],
  tabsState: {},
  selectedFlowId: '',
};

const initialTabState: TabState = {
  selectedRun: undefined,
  leftSidebar: {
    type: LeftSideBarType.NONE,
  },
  rightSidebar: {
    type: RightSideBarType.NONE,
    props: NO_PROPS,
  },
  focusedStep: undefined,
  selectedStepName: 'initialVal',
};

const _flowsReducer = createReducer(
  initialState,
  on(FlowsActions.setInitial, (state, { flows, run }): FlowsState => {
    const clonedFlows: Flow[] = JSON.parse(JSON.stringify(flows));
    const selectedFlowId: UUID = clonedFlows[0].id;

    const tabsState: Record<string, TabState> = {};
    clonedFlows.forEach((f) => {
      tabsState[f.id] = JSON.parse(JSON.stringify(initialTabState));
    });
    if (run !== undefined && run !== null) {
      tabsState[flows[0].id.toString()].selectedRun = run;
    }
    return {
      flows: clonedFlows,
      tabsState: tabsState,
      selectedFlowId: selectedFlowId,
    };
  }),
  on(FlowsActions.selectFlow, (state, { flowId }): FlowsState => {
    return { ...state, selectedFlowId: flowId };
  }),
  on(FlowsActions.updateTrigger, (state, { operation }): FlowsState => {
    if (state.selectedFlowId === null) {
      throw new Error('Selected flow id is null');
    }

    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    const clonedFlows = clonedState.flows;
    const flowIndex = clonedFlows.findIndex(
      (f) => f.id === state.selectedFlowId
    );

    if (flowIndex != -1) {
      const clonedFlow = clonedFlows[flowIndex];
      if (clonedFlow.version) {
        clonedFlows[flowIndex].version = flowHelper.apply(clonedFlow.version, {
          type: FlowOperationType.UPDATE_TRIGGER,
          request: { ...operation },
        });
      }
    }
    clonedState.tabsState[(state.selectedFlowId || '').toString()].focusedStep =
      clonedFlows[flowIndex].version?.trigger as FlowItem;
    return {
      ...state,
      flows: clonedFlows,
      selectedFlowId: state.selectedFlowId,
    };
  }),
  on(FlowsActions.addAction, (state, { operation }): FlowsState => {
    if (state.selectedFlowId === null) {
      throw new Error('Selected flow id is null');
    }
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    const clonedFlows = clonedState.flows;
    const flowIndex = clonedFlows.findIndex(
      (f) => f.id === state.selectedFlowId
    );
    if (flowIndex !== -1) {
      const clonedFlow = clonedFlows[flowIndex];
      if (clonedFlow.version) {
        clonedFlows[flowIndex].version = flowHelper.apply(clonedFlow.version, {
          type: FlowOperationType.ADD_ACTION,
          request: operation,
        });
      }
    }
    return {
      ...state,
      flows: clonedFlows,
      selectedFlowId: state.selectedFlowId,
    };
  }),
  on(FlowsActions.updateAction, (state, { operation }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    const clonedFlows = clonedState.flows;
    const clonedTabsState: Record<string, TabState> = {
      ...clonedState.tabsState,
    };
    const flowIndex = clonedFlows.findIndex(
      (f) => f.id === state.selectedFlowId
    );
    if (flowIndex != -1) {
      const clonedFlow = clonedFlows[flowIndex];
      if (clonedFlow.version) {
        clonedFlows[flowIndex].version = flowHelper.apply(clonedFlow.version, {
          type: FlowOperationType.UPDATE_ACTION,
          request: { ...operation },
        });
      }
    }
    clonedTabsState[state.selectedFlowId.toString()] = {
      ...clonedState.tabsState[state.selectedFlowId.toString()],
      focusedStep: flowHelper.getStep(
        clonedFlows[flowIndex].version,
        operation.name
      ),
    };
    return {
      ...state,
      tabsState: clonedTabsState,
      flows: clonedFlows,
      selectedFlowId: state.selectedFlowId,
    };
  }),
  on(FlowsActions.deleteAction, (state, { operation }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    const clonedFlows = clonedState.flows;
    const flowIndex = clonedFlows.findIndex(
      (f) => f.id === state.selectedFlowId
    );
    if (flowIndex != -1) {
      clonedFlows[flowIndex].version = flowHelper.apply(
        clonedFlows[flowIndex].version,
        {
          type: FlowOperationType.DELETE_ACTION,
          request: operation,
        }
      );
    }
    return {
      ...state,
      tabsState: clonedState.tabsState,
      flows: clonedFlows,
      selectedFlowId: state.selectedFlowId,
    };
  }),
  on(FlowsActions.changeName, (state, { flowId, displayName }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    const clonedFlows = clonedState.flows;
    const flowIndex = clonedFlows.findIndex((f) => f.id === flowId);
    if (flowIndex != -1) {
      clonedFlows[flowIndex].version.displayName = displayName;
    }
    return {
      ...state,
      tabsState: clonedState.tabsState,
      flows: clonedFlows,
      selectedFlowId: state.selectedFlowId,
    };
  }),
  on(
    FlowsActions.deleteFlow,
    (state, { flowId }: { flowId: UUID }): FlowsState => {
      const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
      const index = clonedState.flows.findIndex((f) => f.id == flowId);
      if (index != -1) {
        clonedState.flows.splice(index, 1);
      }
      const deletedFlowHasNext: boolean = index < clonedState.flows.length;
      if (deletedFlowHasNext) {
        clonedState.selectedFlowId = clonedState.flows[index].id;
      } else {
        const notEmpty: boolean = clonedState.flows.length > 0;
        if (notEmpty) {
          clonedState.selectedFlowId =
            clonedState.flows[clonedState.flows.length - 1].id;
        }
      }
      return clonedState;
    }
  ),
  on(FlowsActions.addFlow, (state, { flow }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    clonedState.flows.push(flow);
    clonedState.selectedFlowId = flow.id;
    clonedState.tabsState[clonedState.selectedFlowId.toString()] = JSON.parse(
      JSON.stringify(initialTabState)
    );
    return clonedState;
  }),

  on(
    FlowsActions.savedSuccess,
    (state, { saveRequestId, flow }): FlowsState => {
      const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
      //in case a new version was created after the former one was locked.
      const flowSaved = clonedState.flows.find((f) => f.id == flow.id);
      if (flowSaved) {
        flowSaved.version.id = flow.version.id;
        flowSaved.version.state = flow.version.state;
      }

      return { ...clonedState };
    }
  ),
  on(FlowsActions.setLeftSidebar, (state, { sidebarType }): FlowsState => {
    if (!state.selectedFlowId) {
      throw new Error('Flow id is not selected');
    }
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    const tabState: TabState =
      clonedState.tabsState[state.selectedFlowId.toString()];
    tabState.leftSidebar = {
      type: sidebarType,
    };
    return clonedState;
  }),
  on(FlowsActions.setRun, (state, { flowId, run }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    const tabState: TabState = clonedState.tabsState[flowId.toString()];
    tabState.selectedRun = run;
    return clonedState;
  }),
  on(FlowsActions.exitRun, (state, { flowId }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    const tabState: TabState = clonedState.tabsState[flowId.toString()];
    tabState.selectedRun = undefined;
    return clonedState;
  }),
  on(FlowsActions.deselectStep, (state): FlowsState => {
    if (state.selectedFlowId === undefined || state.selectedFlowId === null) {
      throw new Error('Flow id is not selected');
    }
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    const tabState: TabState =
      clonedState.tabsState[state.selectedFlowId.toString()];
    tabState.focusedStep = undefined;
    return clonedState;
  }),
  on(
    FlowsActions.setRightSidebar,
    (state, { sidebarType, props }): FlowsState => {
      if (state.selectedFlowId === null || state.selectedFlowId === undefined) {
        throw new Error('Flow id is not selected');
      }
      const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
      const tabState: TabState =
        clonedState.tabsState[state.selectedFlowId.toString()];
      tabState.rightSidebar = {
        type: sidebarType,
        props: props,
      };
      return clonedState;
    }
  ),
  on(FlowsActions.selectStepByName, (flowsState, { stepName }) => {
    const flow: Flow | undefined = flowsState.flows.find(
      (f) => f.id === flowsState.selectedFlowId
    );
    const clonedState: FlowsState = JSON.parse(JSON.stringify(flowsState));
    if (flow) {
      const step: FlowItem | undefined = flowHelper.getStep(
        flow.version,
        stepName
      );
      const updatedTabState: TabState = {
        ...clonedState.tabsState[flow.id.toString()],
        focusedStep: step,
      };
      const updatedTabStateWrapper: Record<string, TabState> = {};
      updatedTabStateWrapper[flow.id.toString()] = updatedTabState;
      clonedState.tabsState = {
        ...clonedState.tabsState,
        ...updatedTabStateWrapper,
      };
    }
    return clonedState;
  })
);
export function flowsReducer(state: FlowsState | undefined, action: Action) {
  return _flowsReducer(state, action);
}
