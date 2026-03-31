const bcrypt = require('bcrypt');
const User = require("../models/User");
const Post = require("../models/Post");

module.exports.addPost = (req, res) => {
	console.log("Incoming Blog Data:", req.body);

	let newPost = new Post({
		title: req.body.title,
		content: req.body.content,
        image: req.body.image,
		author: req.user.id
	});


	    return newPost.save()
	    .then(savedPost => res.status(201).send(savedPost))
	    .catch(saveErr => {
	        console.error("Error in saving the blog post: ", saveErr)

	        return res.status(500).send({ error: 'Failed to save the blog post' });
	    });

};

module.exports.getPosts = (req, res) => {

	return Post.find({})
    .populate('author', 'userName')
    .then(posts => {
		return res.status(200).send({ posts });
	}).catch(findErr => {
	    console.error("Error in finding blog posts: ", findErr)

	    return res.status(500).send({ message:'Error finding blog posts' });
	});
}; 


module.exports.getMyPosts = (req, res) => {
    const userId = req.user.id;

    return Post.find({author: userId})
    .populate('author', 'userName')
    .then(posts => {
        return res.status(200).send({ posts });
    }).catch(findErr => {
        console.error("Error in finding blog posts: ", findErr)

        return res.status(500).send({ message:'Error finding blog posts' });
    });
}; 



module.exports.getPostById = (req, res) => {

	return Post.findById(req.params.postId)
    .populate('author', 'userName')
    .then(post => {
		return res.status(200).send(post);
	}).catch(findErr => {
	    console.error("Error in finding blog posts: ", findErr)

	    return res.status(500).send({ message:'Error finding blog posts' });
	});
}; 



module.exports.postKeyword = (req, res) => {
  const keyword = req.query.keyword ? req.query.keyword.trim() : "";

  // Create a search filter
  const filter = keyword
    ? {
        $or: [
          { title: { $regex: keyword, $options: "i" } }, // Case-insensitive
          { content: { $regex: keyword, $options: "i" } },
        ],
      }
    : {};

  Post.find(filter)
    .populate("author", "userName")
    .then((posts) => {
      return res.status(200).send({ posts });
    })
    .catch((findErr) => {
      console.error("Error in finding blog posts: ", findErr);
      return res.status(500).send({ message: "Error finding blog posts" });
    });
};

module.exports.updatePost = (req, res) => {
  const { title, content } = req.body;
  const postId = req.params.postId;

  Post.findById(postId)
    .then(post => {
      if (!post) {
        return res.status(404).send({ error: 'Blog post not found' });
      }

      if (post.author.toString() !== req.user.id && !req.user.isAdmin) {
        return res.status(403).send({ error: 'Unauthorized to update this post' });
      }

      post.title = title;
      post.content = content;

      return post.save();
    })
    .then(updated => res.status(200).send({
      message: 'Blog post updated successfully',
      updatedPost: updated
    }))
    .catch(err => {
      console.error("Error in updating blog post:", err);
      res.status(500).send({ error: 'Error in updating blog post.' });
    });
};


module.exports.deletePost = (req, res) => {

    const postId = req.params.postId;
    const userId = req.user.id; 

    Post.findById(postId)
        .then(post => {
            if (!post) {
                return res.status(404).send({ error: 'Blog post not found' });
            }

   
            if (post.author.toString() !== userId && !req.user.isAdmin) {
                return res.status(403).send({
                    auth: "Failed",
                    message: "Action forbidden. Only the author or admin can delete this post."
                });
            }

            return Post.findByIdAndDelete(postId)
                .then(() => res.status(200).send({ message: 'Blog post deleted successfully' }));
        })
        .catch(err => {
            console.error("Error in deleting blog post:", err);
            res.status(500).send({ error: 'Error in deleting the blog post.' });
        });
};

module.exports.addComment = (req, res) => {

	if(req.user.isAdmin){
    	return res.send("Action Forbidden")
  	}

	return Post.findById(req.params.postId).then(post => {

    	let userComment = {
    		user: req.user.id,
        	comment: req.body.comment
    	}

	    post.comments.push(userComment);
	    
	    return post.save()
	    .then(updatedPost => {
	        if (!updatedPost) {
	            return res.status(404).send({ error: 'Blog Post not found' });
	        }

	        return res.status(200).send({ 
	        	message: 'comment added successfully', 
	        	updatedPost: updatedPost 
	        });

	    })
	    .catch(err => {
			console.error("Error in updating a blog post: ", err)
			return res.status(500).send({ error: 'Error in updating a blog post.' });
		});
	})
};


module.exports.getComments = (req, res) => {

	return Post.findById(req.params.postId).then(post => {

		return res.status(200).send({ comments: post.comments });
	})
};


module.exports.editComment = (req, res) => {
  const { postId, commentId } = req.params;
  const { comment } = req.body;

  return Post.findById(postId).populate("comments.user", "userName")
    .then(post => {
      if (!post) {
        return res.status(404).send({ error: "Blog post not found" });
      }

      const targetComment = post.comments.id(commentId);

      if (!targetComment) {
        return res.status(404).send({ error: "Comment not found" });
      }

      // ✅ PERMISSION
      if (
        targetComment.user.toString() !== req.user.id &&
        !req.user.isAdmin
      ) {
        return res.status(403).send({ error: "Unauthorized" });
      }

      targetComment.comment = comment;

      return post.save().then(updatedPost =>
        res.status(200).send({
          message: "Comment updated successfully",
          updatedPost
        })
      );
    })
    .catch(err => {
      console.error(err);
      return res.status(500).send({ error: "Error editing comment" });
    });
};

module.exports.deleteComment = (req, res) => {
  const { postId, commentId } = req.params;

  return Post.findById(postId)
    .then(post => {
      if (!post) {
        return res.status(404).send({ error: "Post not found" });
      }

      const comment = post.comments.id(commentId);

      if (!comment) {
        return res.status(404).send({ error: "Comment not found" });
      }

      // ✅ PERMISSION CHECK
      if (
        comment.user.toString() !== req.user.id &&
        !req.user.isAdmin
      ) {
        return res.status(403).send({ error: "Unauthorized" });
      }

      // ✅ DELETE
      comment.deleteOne();

      return post.save().then(() =>
        res.status(200).send({ message: "Comment deleted" })
      );
    })
    .catch(err => {
      console.error(err);
      res.status(500).send({ error: "Server error" });
    });
};

module.exports.postCounts = async (req, res) => {
    try {
        const users = await User.aggregate([
            { $match: { isAdmin: false } }, 
            {
                $lookup: {
                    from: 'posts',
                    localField: '_id',
                    foreignField: 'author',
                    as: 'userPosts'
                }
            },
            {
                $project: {
                    userName: 1,
                    postCount: { $size: '$userPosts' } 
                }
            }
        ]);

        if (!users || users.length === 0) {
            return res.status(404).send({ error: 'No non-admin users found' });
        }

        return res.status(200).send({ users });
    } catch (err) {
        console.error('Error fetching users with post counts:', err);
        return res.status(500).send({ error: 'Failed to fetch users with post counts' });
    }
};


module.exports.likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      // ❌ Unlike
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      // ❤️ Like
      post.likes.push(userId);
    }

    await post.save();

    return res.status(200).send({
      message: alreadyLiked ? "Post unliked" : "Post liked",
      likes: post.likes.length
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Error liking post" });
  }
};
