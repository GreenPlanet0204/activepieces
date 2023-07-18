
import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { advancedMapping } from './lib/actions/advanced-mapping';

export const dataMapper = createPiece({
  name: 'data-mapper',
  displayName: 'Data Mapper',
  logoUrl: 'https://cdn.activepieces.com/pieces/data-mapper.png',
  version: packageJson.version,
  authors: [
    "abuaboud"
  ],
  actions: [
    advancedMapping
  ],
  triggers: [
  ],
});
