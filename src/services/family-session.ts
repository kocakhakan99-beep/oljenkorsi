export type FamilyRevisionSession = {
  userId: string;
  familyId: string;
  revision: number;
};

export function revisionForFamilySession(
  session: FamilyRevisionSession | null,
  userId: string,
  familyId: string,
  serverRevision: number,
): number | null {
  return session?.userId === userId &&
    session.familyId === familyId &&
    session.revision === serverRevision
    ? serverRevision
    : null;
}
