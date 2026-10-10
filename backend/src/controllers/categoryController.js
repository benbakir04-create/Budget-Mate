const prisma = require('../config/database');
const { validationResult } = require('express-validator');

const getCategories = async (req, res, next) => {
  try {
    // If user is a partner, they fetch categories of their owner where isPrivate is false
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;
    
    const whereClause = { userId: ownerId };
    
    // 🔒 Strictly enforce that partners cannot retrieve private categories
    if (req.user.role === 'partner') {
      whereClause.isPrivate = false;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        nameAr: true,
        icon: true,
        color: true,
        type: true,
        isPrivate: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    return res.json({ success: true, data: { categories } });
  } catch (err) {
    return next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    // 🔒 Only owner is allowed to create categories
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only accounts with Owner role can manage categories' }
      });
    }

    const { name, nameAr, icon, color, type, isPrivate } = req.body;

    // Check if category name already exists for this owner
    const existing = await prisma.category.findFirst({
      where: {
        userId: req.user.id,
        name: { equals: name, mode: 'insensitive' }
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'CATEGORY_EXISTS', message: 'Category name already exists' }
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        nameAr: nameAr || name,
        icon: icon || 'tag',
        color: color || '#1D9E75',
        type,
        isPrivate: isPrivate || false,
        userId: req.user.id
      }
    });

    return res.status(201).json({ success: true, data: { category } });
  } catch (err) {
    return next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    // 🔒 Only owner can manage categories
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only accounts with Owner role can manage categories' }
      });
    }

    const { id } = req.params;
    const { name, nameAr, icon, color, type, isPrivate } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found' }
      });
    }

    // Verify ownership
    if (existing.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to modify this category' }
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (type !== undefined) updateData.type = type;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    const category = await prisma.category.update({
      where: { id },
      data: updateData
    });

    return res.json({ success: true, data: { category } });
  } catch (err) {
    return next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    // 🔒 Only owner can manage categories
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only accounts with Owner role can manage categories' }
      });
    }

    const { id } = req.params;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found' }
      });
    }

    // Verify ownership
    if (existing.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to delete this category' }
      });
    }

    await prisma.category.delete({ where: { id } });

    return res.json({ success: true, data: { message: 'Category deleted' } });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};