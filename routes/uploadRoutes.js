const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "blog_images" },
});

const upload = multer({ storage });

router.post("/image", upload.single("image"), (req, res) => {
  res.json({ imageUrl: req.file.path });
});
