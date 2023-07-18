import { HttpRequest, HttpMethod, AuthenticationType, httpClient, isNotUndefined } from '@activepieces/pieces-common';
import { pickBy } from 'lodash';
import { TodoistCreateTaskRequest, TodoistProject, TodoistTask } from '../models';

const API = 'https://api.todoist.com/rest/v2';

export const todoistRestClient = {
  projects: {
    async list({ token }: ProjectsListParams): Promise<TodoistProject[]> {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API}/projects`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };

      const response = await httpClient.sendRequest<TodoistProject[]>(request);
      return response.body;
    }
  },

  tasks: {
    async create({ token, project_id, content }: TasksCreateParams): Promise<TodoistTask> {
      const request: HttpRequest<TodoistCreateTaskRequest> = {
        method: HttpMethod.POST,
        url: `${API}/tasks`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
        body: {
          content,
          project_id,
        },
      };

      const response = await httpClient.sendRequest<TodoistTask>(request);
      return response.body;
    },

    async list({ token, project_id, filter }: TasksListParams): Promise<TodoistTask[]> {
      const queryParams = {
        filter,
        project_id,
      };

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API}/tasks`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
        queryParams: pickBy(queryParams, isNotUndefined),
      };

      const response = await httpClient.sendRequest<TodoistTask[]>(request);
      return response.body;
    }
  }
};

type ProjectsListParams = {
  token: string;
}

type TasksCreateParams = {
  token: string;
  content: string;
  project_id?: string | undefined;
}

type TasksListParams = {
  token: string;
  project_id?: string | undefined;
  filter?: string | undefined;
}
