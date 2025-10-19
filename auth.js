const jwt = require("jsonwebtoken");
const secret = "BlogPostManagementAPI";
const Post = require("./models/Post.js")

module.exports.createAccessToken = (user) => {
	const data = {
		id : user._id,
		email : user.email,
		isAdmin : user.isAdmin
	};

	return jwt.sign(data, secret, {});
};

module.exports.verify = (req, res, next) => {
    // console.log(req.headers.authorization);

    let token = req.headers.authorization;

    if(typeof token === "undefined"){
        return res.send({ auth: "Failed. No Token" });
    } else {
        // console.log(token);		
        token = token.slice(7, token.length);
        // console.log(token);

        jwt.verify(token, secret, function(err, decodedToken){ 
            if(err){
                return res.send({
                    auth: "Failed",
                    message: err.message
                });
            } else {
				// console.log("result from verify method:")
                // console.log(decodedToken);
                
                req.user = decodedToken;
                next();
            }
        })
    }
};

module.exports.verifyOwnerOrAdmin = (req, res, next) => {
    Post.findById(req.params.postId)
        .then(post => {
            if (!post) {
                return res.status(404).send({
                    auth: "Failed",
                    message: "Blog post not found."
                });
            }

            if (post.author.toString() === req.user.id || req.user.isAdmin) {
                next();
            } else {
                return res.status(403).send({
                    auth: "Failed",
                    message: "Action Forbidden. Only the blog owner or admin can modify this post."
                });
            }
        })
};

module.exports.verifyAdmin = (req, res, next) => {
	if(req.user.isAdmin){
		next();
	} else {
		return res.status(403).send({
			auth: "Failed",
			message: "Action Forbidden. For Admin only."
		})
	}
}


function validateObjectId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
    return res.status(400).send({ error: "Invalid blog post ID" });
  }
  next();
}

module.exports.isLoggedIn = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.sendStatus(401);
    }
}