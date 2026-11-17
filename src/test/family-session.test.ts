import { describe, expect, it } from 'vitest';
import { revisionForFamilySession } from '../services/family-session';

describe('perhetilin tallennusrevisio', () => {
  it('säilyttää saman käyttäjän ja perheen revision näkymän avausten välillä', () => {
    expect(
      revisionForFamilySession(
        { userId: 'user-a', familyId: 'family-a', revision: 4 },
        'user-a',
        'family-a',
        4,
      ),
    ).toBe(4);
  });

  it('vaatii uuden latauksen käyttäjän, perheen tai palvelinrevision vaihtuessa', () => {
    const session = { userId: 'user-a', familyId: 'family-a', revision: 4 };
    expect(revisionForFamilySession(session, 'user-b', 'family-a', 4)).toBeNull();
    expect(revisionForFamilySession(session, 'user-a', 'family-b', 4)).toBeNull();
    expect(revisionForFamilySession(session, 'user-a', 'family-a', 5)).toBeNull();
  });
});
