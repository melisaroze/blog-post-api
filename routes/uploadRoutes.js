const express = require("express");
const multer = require("multer");
const storage = require("../config/cloudinaryStorage");

const router = express.Router();
const upload = multer({ storage });

router.post("/image", upload.single("image"), (req, res) => {
  res.json({
    success: true,
    imageUrl: req.file.path, // this is the Cloudinary URL
  });
});

module.exports = router;
