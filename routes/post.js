const express = require("express");
const postController = require("../controllers/post");
const auth = require("../auth");

const { verify, verifyOwnerOrAdmin, verifyAdmin} = auth;

const router = express.Router();

router.post("/addPost", verify, postController.addPost);

router.get("/getPosts", postController.getPosts);

router.get("/postCounts", postController.postCounts);

router.get("/getPost/:postId", postController.getPostById);

router.patch("/updatePost/:postId", verify, verifyOwnerOrAdmin, postController.updatePost);

router.delete("/deletePost/:postId", verify, verifyOwnerOrAdmin, postController.deletePost);

router.patch("/addComment/:postId", verify, postController.addComment);

router.get("/getComments/:postId", verify, postController.getComments);

router.delete("/deleteComment/:postId", verify, verifyAdmin, postController.deleteComment);

module.exports = router;