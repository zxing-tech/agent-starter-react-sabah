import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Theraverse Sabah',
  pageTitle: 'Sabah Mental Health Support',
  pageDescription: 'Connect with your compassionate AI companion in Sabah',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/logo-transparent.png',
  accent: '#1A8A8A',
  logoDark: '/logo-transparent.png',
  accentDark: '#47C4CF',
  startButtonText: 'Start Conversation',
};
