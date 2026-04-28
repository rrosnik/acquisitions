import express from 'express';
import {
  deleteUserById,
  fetchAllUsers,
  fetchUserById,
  updateUserById,
} from '#controllers/users.controller.js';
import {
  authenticateToken,
  requireRole,
} from '#middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole(['admin']), fetchAllUsers);

router.get('/:id', authenticateToken, fetchUserById);

router.put('/:id', authenticateToken, updateUserById);

router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  deleteUserById
);

export default router;
