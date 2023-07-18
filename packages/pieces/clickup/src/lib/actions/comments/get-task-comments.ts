import { createAction, Property } from "@activepieces/pieces-framework";
import {  HttpMethod, getAccessTokenOrThrow } from "@activepieces/pieces-common";
import { clickupCommon, callClickUpApi } from "../../common";


export const getClickupTaskComments = createAction({
	name: 'get_task_comments',
	description: 'Gets comments from a task in ClickUp',
	displayName: 'Get Task Comments',
	props: {
		authentication: clickupCommon.authentication,
		task_id: Property.ShortText({
			description: 'The ID of the task to get',
			displayName: 'Task ID',
			required: true,
		}),
	},
	async run(configValue) {
		const { task_id, authentication } = configValue.propsValue;
		const response = await callClickUpApi(HttpMethod.GET,
			`/task/${task_id}/comment`, getAccessTokenOrThrow(authentication), {
		});

		return response.body;
	},
});
