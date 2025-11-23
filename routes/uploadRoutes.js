const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = require("../config/cloudinaryStorage"); // your Cloudinary storage config

const upload = multer({ storage });

router.post("/image", upload.single("image"), (req, res) => {
  try {
    console.log("File info:", req.file); 
    res.json({
      success: true,
      imageUrl: req.file.path, 
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Image upload failed" });
  }
});

module.exports = router;