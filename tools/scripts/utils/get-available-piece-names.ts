import { readdir } from 'node:fs/promises'

export const getAvailablePieceNames = async (): Promise<string[]> => {
  const ignoredPackages = ['framework', 'apps', 'dist', 'common']
  const packageNames = await readdir('packages/pieces')
  return packageNames.filter(p => !ignoredPackages.includes(p))
}
