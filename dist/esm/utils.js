/**
 * Resolve a UserRef (UUID string or User object) to a UUID string.
 * Used by all resource methods that accept a user parameter.
 */
export function resolveUuid(ref) {
    if (typeof ref === 'string')
        return ref;
    return ref.uuid;
}
//# sourceMappingURL=utils.js.map