import { createAction, Property} from "@activepieces/pieces-framework";
import {  HttpMethod, getAccessTokenOrThrow } from "@activepieces/pieces-common";

import { clickupCommon, callClickUpApi } from "../../common";


export const getClickupSpace = createAction({
	name: 'get_space',
	description: 'Gets a space in a ClickUp',
	displayName: 'Get Space',
	props: {
		authentication: clickupCommon.authentication,
		space_id: Property.ShortText({
			description: 'The id of the space to get',
			displayName: 'Space ID',
			required: true,
		}),
	},
	async run(configValue) {
		const { space_id, authentication } = configValue.propsValue;
		const response = await callClickUpApi(HttpMethod.GET,
			`space/${space_id}`, getAccessTokenOrThrow(authentication), {
		});
		return response.body;
	},
});
