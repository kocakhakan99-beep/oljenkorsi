import type { State } from '../domain/model';
import { validate } from './validation';

/** Display choices are local to a user and must not overwrite other family members'. */
export function sharedCloudState(state: State): State {
  return validate({
    ...state,
    settings: {
      ...state.settings,
      onboarded: true,
      private: false,
      month: '2000-01',
      theme: 'neutral',
      mode: 'system',
      accent: '#17604d',
    },
  });
}

/** Keep the active browser's view choices when a cloud document is loaded. */
export function withLocalDisplaySettings(cloud: State, local: State): State {
  return validate({
    ...cloud,
    settings: {
      ...cloud.settings,
      onboarded: true,
      private: local.settings.private,
      month: local.settings.month,
      theme: local.settings.theme,
      mode: local.settings.mode,
      accent: local.settings.accent,
    },
  });
}
