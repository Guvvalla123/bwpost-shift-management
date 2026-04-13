/**
 * Parses and enforces pagination params.
 * @param {Object} query - req.query or raw object
 * @param {number} defaultLimit - default page size (default 20)
 * @param {number} maxLimit - hard cap (default 50)
 * @returns {{ page, limit, skip }}
 */
const getPaginationParams = (
  query = {},
  defaultLimit = 20,
  maxLimit = 50
) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const requested = parseInt(query.limit) || defaultLimit;
  const limit = Math.min(requested, maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Builds standard pagination response metadata.
 * @param {number} total - total document count
 * @param {number} page - current page
 * @param {number} limit - page size used
 * @returns {{ total, page, limit, totalPages }}
 */
const getPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

module.exports = { getPaginationParams, getPaginationMeta };
