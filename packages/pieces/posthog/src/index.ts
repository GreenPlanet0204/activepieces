import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { posthogCreateEvent } from './lib/actions/create-event';
import { posthogCreateProject } from './lib/actions/create-project';

export const posthog = createPiece({
  name: 'posthog',
  displayName: "PostHog",
  logoUrl: 'https://cdn.activepieces.com/pieces/posthog.png',
  actions: [posthogCreateEvent, posthogCreateProject],
  authors: ['kanarelo'],
  triggers: [],
  version: packageJson.version,
});
