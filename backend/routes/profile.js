const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { detectImageType } = require('../utils/imageUpload');
const { logDataAccess } = require('../utils/logger');

const router = express.Router();

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
});

const handleAvatarUpload = (req, res, next) => {
  avatarUpload.single('avatar')(req, res, error => {
    if (error instanceof multer.MulterError) {
      const isOversized = error.code === 'LIMIT_FILE_SIZE';
      return next(new AppError(
        isOversized ? 'Profile photo must be 2 MB or smaller' : 'Upload only one profile photo',
        isOversized ? 413 : 400
      ));
    }
    next(error);
  });
};

// Update the signed-in user's display name.
router.put('/', async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim().replace(/\s+/g, ' ') : '';
    if (name.length < 2 || name.length > 80) {
      throw new AppError('Name must be between 2 and 80 characters', 400);
    }

    const user = await User.findByIdAndUpdate(req.user._id, { name }, { new: true, runValidators: true });
    logDataAccess(user._id, 'update_profile', 'profile', req.ip);
    res.json({ success: true, data: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
});

router.put('/avatar', handleAvatarUpload, async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('Choose an image to upload', 400);
    const contentType = detectImageType(req.file.buffer);
    if (!contentType) throw new AppError('Profile photo must be a JPEG, PNG, or WebP image', 400);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: { data: req.file.buffer, contentType, updatedAt: new Date() } },
      { new: true }
    );
    logDataAccess(user._id, 'update_avatar', 'profile', req.ip);
    res.json({ success: true, data: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
});

router.delete('/avatar', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { $unset: { avatar: 1 } }, { new: true });
    logDataAccess(user._id, 'remove_avatar', 'profile', req.ip);
    res.json({ success: true, data: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
});

router.get('/avatar', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+avatar.data');
    if (!user?.avatar?.data) throw new AppError('No profile photo set', 404);

    res.set({
      'Content-Type': user.avatar.contentType,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-cache',
    });
    res.send(user.avatar.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
