
import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { createCard } from './lib/actions/create-card';
import { getCard } from './lib/actions/get-card';

export const trello = createPiece({
  name: 'trello',
  displayName: 'Trello',
  logoUrl: 'https://cdn.activepieces.com/pieces/trello.png',
  version: packageJson.version,
  authors: ['ShayPunter'],
  actions: [
    createCard,
    getCard,
  ],
  triggers: [
  ],
});