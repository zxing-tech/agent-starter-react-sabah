import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Healthier Sabah',
  pageTitle: 'Sabah Mental Health Support',
  pageDescription: 'Connect with your compassionate AI companion in Sabah',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/Flag_of_Sabah.svg.png',
  accent: '#1A8A8A',
  logoDark: '/Flag_of_Sabah.svg.png',
  accentDark: '#47C4CF',
  startButtonText: 'Start Conversation',
};
