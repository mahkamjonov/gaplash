const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INVITE_CODE = /^[A-Za-z0-9_-]{16,32}$/;

/** Ids and codes come from the URL, so they are checked before they reach the database. */
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

export const isInviteCode = (value: unknown): value is string => typeof value === "string" && INVITE_CODE.test(value);
