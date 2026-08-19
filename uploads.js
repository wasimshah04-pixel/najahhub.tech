import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/uploads — File upload endpoint (Admin protected)
router.post('/', requireAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = req.body.folder || 'uploads';
    const fileUrl = `/storage/${folder}/${req.file.filename}`;

    res.json({
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (err) {
    console.error('[Uploads] Upload error:', err.message);
    res.status(500).json({ error: 'File upload failed' });
  }
});

export default router;
