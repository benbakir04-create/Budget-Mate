const express = require('express');
const authMiddleware = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/categories - Get categories (filters private ones for partners)
router.get('/', categoryController.getCategories);

// POST /api/categories - Create category (Owner only)
router.post('/', categoryController.createCategory);

// PUT /api/categories/:id - Update category (Owner only, verifies ownership)
router.put('/:id', categoryController.updateCategory);

// DELETE /api/categories/:id - Delete category (Owner only, verifies ownership)
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
