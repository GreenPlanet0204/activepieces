import { Action, createReducer, on } from '@ngrx/store';
import { ProjectsState } from '../common-state.model';
import { ProjectActions } from './project.action';

const initialState: ProjectsState = {
  loaded: false,
  selectedIndex: 0,
  projects: [],
};

const _projectReducer = createReducer(
  initialState,
  on(ProjectActions.setProjects, (_state, { projects }): ProjectsState => {
    return { projects: projects, loaded: true, selectedIndex: 0 };
  }),
  // eslint-disable-next-line no-empty-pattern, @typescript-eslint/no-unused-vars
  on(ProjectActions.clearProjects, (_state, {}): ProjectsState => {
    return { projects: [], loaded: false, selectedIndex: 0 };
  })
);

export function projectReducer(
  state: ProjectsState | undefined,
  action: Action
) {
  return _projectReducer(state, action);
}
