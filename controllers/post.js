const bcrypt = require('bcrypt');
const User = require("../models/User");
const Post = require("../models/Post");

module.exports.addPost = (req, res) => {
	console.log("Incoming Blog Data:", req.body);

	let newPost = new Post({
		title: req.body.title,
		content: req.body.content,
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

module.exports.deleteComment = (req, res) => {
    const { postId} = req.params;
    const { commentId} = req.body;

    return Post.findById(postId)
        .then(post => {
            if (![post]) {
                return res.status(404).send({ error: 'Blog post not found' });
            }

            const commentIndex = post.comments.findIndex(
                comment => comment._id.toString() === commentId
            );

            if (commentIndex === -1) {
                return res.status(404).send({ error: 'Comment not found' });
            }

            post.comments.splice(commentIndex, 1);

            return post.save()
                .then(() => res.status(200).send({ message: 'Comment deleted successfully' }));
        })
        .catch(err => {
            console.error("Error deleting comment:", err);
            return res.status(500).send({ error: 'Error deleting comment' });
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