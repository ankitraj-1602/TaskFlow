const SearchService = require('../services/search.service');
const { successResponse, errorResponse } = require('../utils/response.utils');

const searchService = new SearchService();

class SearchController {
  static async search(req, res) {
    try {
      const userId = req.user.userId;
      const { q, workspaceId, limit } = req.query;

      if (!q || q.trim().length === 0) {
        return successResponse(
          res,
          { tasks: [], projects: [], comments: [], total: 0 },
          'Empty query'
        );
      }

      const results = await searchService.search(userId, {
        query: q,
        workspaceId,
        limit: limit ? parseInt(limit) : 20,
      });

      successResponse(res, results, 'Search completed successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
}

module.exports = SearchController;