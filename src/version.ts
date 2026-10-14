import packageInfo from '../package.json' with { type: 'json' };

export const APP_VERSION = packageInfo.version;
export const CALCULATION_VERSION = 'physical-presence-2.2';
