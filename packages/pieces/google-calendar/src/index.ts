import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { createQuickCalendarEvent } from './lib/actions/create-quick-event';
import { calendarEventChanged } from './lib/triggers/calendar-event';


export const googleCalendar = createPiece({
	name: 'google-calendar',
	logoUrl: 'https://cdn.activepieces.com/pieces/google-calendar.png',
	displayName: "Google Calendar",
  	version: packageJson.version,
	authors: ['osamahaikal'],
	actions: [createQuickCalendarEvent],
	triggers: [calendarEventChanged],
});
