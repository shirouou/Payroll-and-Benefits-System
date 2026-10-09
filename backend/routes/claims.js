const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const HMOEnrollment = require('../models/HMOEnrollment');
const { AppError } = require('../middleware/errorHandler');
const multer = require('multer');

const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new AppError('Receipt must be a JPEG, PNG, or WebP image', 400));
    }
    callback(null, true);
  },
});

const handleReceiptUpload = (req, res, next) => {
  receiptUpload.single('receiptImage')(req, res, error => {
    if (error instanceof multer.MulterError) {
      const isOversized = error.code === 'LIMIT_FILE_SIZE';
      return next(new AppError(
        isOversized ? 'Receipt image must be 5 MB or smaller' : 'Upload only one receipt image',
        isOversized ? 413 : 400
      ));
    }
    next(error);
  });
};

// GET all claims
router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'employee' ? { employeeId: req.user.employeeId } : {};
    const claims = await Claim.find(filter)
      .populate('employeeId')
      .populate('enrollmentId')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: claims,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

// Return only enrollments an employee may use for a claim.
router.get('/enrollments/available', async (req, res, next) => {
  try {
    const filter = req.user.role === 'employee' ? { employeeId: req.user.employeeId, status: 'Active' } : { status: 'Active' };
    const enrollments = await HMOEnrollment.find(filter).populate('employeeId', 'name');
    res.json({ success: true, data: enrollments });
  } catch (error) {
    next(error);
  }
});

// GET single claim
router.get('/:id', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('employeeId')
      .populate('enrollmentId');
    if (!claim) {
      throw new AppError('Claim not found', 404);
    }
    if (req.user.role === 'employee' && String(claim.employeeId?._id || claim.employeeId) !== String(req.user.employeeId)) {
      throw new AppError('You do not have permission to view this claim', 403);
    }
    res.json({
      success: true,
      data: claim,
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// CREATE claim
router.post('/', handleReceiptUpload, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.receiptImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      };
    }
    if (req.user.role === 'employee') {
      if (!req.user.employeeId) throw new AppError('Employee account is not linked to an employee record', 403);
      payload.employeeId = req.user.employeeId;
      const enrollment = await HMOEnrollment.findOne({ _id: payload.enrollmentId, employeeId: req.user.employeeId, status: 'Active' });
      if (!enrollment) throw new AppError('You may only submit claims for your active enrollment', 403);
    }
    const claim = await Claim.create(payload);
    await claim.populate(['employeeId', 'enrollmentId']);
    const responseClaim = claim.toObject();
    if (responseClaim.receiptImage) delete responseClaim.receiptImage.data;
    res.status(201).json({
      success: true,
      data: responseClaim,
      message: 'Claim created successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// Retrieve the optional image attached to a claim (employees may view their own).
router.get('/:id/receipt', async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id).select('+receiptImage.data');
    if (!claim) throw new AppError('Claim not found', 404);
    const claimEmployeeId = claim.employeeId?._id || claim.employeeId;
    const userEmployeeId = req.user.employeeId?._id || req.user.employeeId;
    if (req.user.role === 'employee' && String(claimEmployeeId) !== String(userEmployeeId)) {
      throw new AppError('You do not have permission to view this receipt', 403);
    }
    if (!claim.receiptImage?.data) throw new AppError('No receipt image is attached', 404);

    res.set('Content-Type', claim.receiptImage.contentType);
    res.set('Content-Disposition', 'inline');
    res.set('X-Content-Type-Options', 'nosniff');
    res.send(claim.receiptImage.data);
  } catch (error) {
    next(error);
  }
});

// UPDATE claim
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role === 'employee') throw new AppError('Employees cannot update claims', 403);
    const claim = await Claim.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(['employeeId', 'enrollmentId']);

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }
    res.json({
      success: true,
      data: claim,
      message: 'Claim updated successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// APPROVE claim
router.post('/:id/approve', async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role)) throw new AppError('Only administrators or HR may approve claims', 403);
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }
    if (claim.status !== 'Pending') {
      throw new AppError('Only pending claims may be approved', 400);
    }

    const approvedAmount = Number(req.body.approvedAmount);
    if (!Number.isFinite(approvedAmount) || approvedAmount < 0 || approvedAmount > claim.claimAmount) {
      throw new AppError(`Approved amount must be between 0 and ${claim.claimAmount}`, 400);
    }

    claim.status = 'Approved';
    claim.approvedAmount = approvedAmount;
    await claim.save();
    await claim.populate(['employeeId', 'enrollmentId']);
    res.json({
      success: true,
      data: claim,
      message: 'Claim approved successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// REJECT claim
router.post('/:id/reject', async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role)) throw new AppError('Only administrators or HR may reject claims', 403);
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }
    if (claim.status !== 'Pending') {
      throw new AppError('Only pending claims may be rejected', 400);
    }
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';
    if (!notes) {
      throw new AppError('A rejection reason is required', 400);
    }

    claim.status = 'Rejected';
    claim.notes = notes;
    await claim.save();
    await claim.populate(['employeeId', 'enrollmentId']);
    res.json({
      success: true,
      data: claim,
      message: 'Claim rejected successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// GET claims by status
router.get('/status/:status', async (req, res) => {
  try {
    const filter = { status: req.params.status };
    if (req.user.role === 'employee') filter.employeeId = req.user.employeeId;
    const claims = await Claim.find(filter)
      .populate('employeeId')
      .populate('enrollmentId');
    res.json({
      success: true,
      data: claims,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

module.exports = router;
