import { z } from 'zod';
import type { State } from '../domain/model';

export const preferencesSchema = z.object({
  theme: z.enum(['neutral', 'blue', 'green', 'contrast', 'custom']),
  mode: z.enum(['system', 'light', 'dark']),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  private: z.boolean(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  dismissedHelp: z.array(z.string().max(100)).max(100),
}).strict();
export type UserPreferences = z.infer<typeof preferencesSchema>;

export function preferencesFromState(state: State, dismissedHelp: Set<string>): UserPreferences {
  const { theme, mode, accent, month } = state.settings;
  return preferencesSchema.parse({ theme, mode, accent, private: state.settings.private, month, dismissedHelp: [...dismissedHelp].sort() });
}
