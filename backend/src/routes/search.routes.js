const router = require('express').Router();
const SearchController = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { apiRateLimiter } = require('../middleware/rateLimit.middleware');

router.use(authenticate);

// Debounced search — hit rate limiter to protect DB
router.get('/', apiRateLimiter, SearchController.search);

module.exports = router;