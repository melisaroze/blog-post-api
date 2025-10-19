const bcrypt = require('bcrypt');
const User = require("../models/User");
const Post = require("../models/Post");
const auth = require("../auth");


module.exports.registerUser = (req,res) => {

	if (!req.body.email.includes("@")){

	    return res.status(400).send({ error: "Email invalid" });

	} else if (req.body.password.length < 8) {

	    return res.status(400).send({ error: "Password must be atleast 8 characters" });

	} else {

		let newUser = new User({
			userName : req.body.userName,
			email : req.body.email,
			password : bcrypt.hashSync(req.body.password, 10)
		})

		return newUser.save()
		.then((user) => res.status(201).send({ message: "Registered Successfully" }))
		.catch(err => {
			console.error("Error in saving: ", err)
			return res.status(500).send({ error: "Error in save"})
		})
	}
};

module.exports.loginUser = (req,res) => {

	if(req.body.email.includes("@")){

		return User.findOne({ email : req.body.email })
		.then(user => {

			if(user == null){

				return res.status(404).send({ error: "No Email Found" });

			} else {

				const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password);

				if (isPasswordCorrect) {

					return res.status(200).send({ 
						access : auth.createAccessToken(user)
					})

				} else {

					return res.status(401).send({ message: "Email and password do not match" });

				}
			}
		})
		.catch(err => err);

	} else {

	    return res.status(400).send(false);
	}
};


module.exports.getProfile = (req, res) => {

	return User.findById(req.user.id)
	.then(user => {
	    if (!user) {
	        return res.status(404).send({ error: 'User not found' });
	    }

	    user.password = undefined;

	    return res.status(200).send({ user });
	})
	.catch(err => {
		console.error("Error in fetching user profile", err)
		return res.status(500).send({ error: 'Failed to fetch user profile' })
	});

};