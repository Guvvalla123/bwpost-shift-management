// pagination.js
// Helper functions for pagination.
//
// Pagination means showing data in pages
// instead of loading everything at once.
// Example: show 10 shifts per page.
//
// Without pagination:
// Loading 1000 shifts at once is slow
//
// With pagination:
// Load 10 shifts, user clicks next
// to see next 10 shifts. Much faster.

// getPaginationParams - reads page and limit from the request query
// Returns page number, limit (items per page), and skip (how many to skip)
//
// query - the request query object (req.query)
// defaultLimit - default number of items per page (default is 20)
// maxLimit - maximum items per page allowed (default is 50)
//
// Example: ?page=2&limit=10 returns { page: 2, limit: 10, skip: 10 }
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

// getPaginationMeta - builds pagination info to include in the response
// so the frontend knows how many pages exist and which page it is on
//
// total - total number of items in the database for this query
// page - the current page number
// limit - how many items per page
//
// Returns: { total, page, limit, totalPages }
const getPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

module.exports = { getPaginationParams, getPaginationMeta };
