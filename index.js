const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const port = 4000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cors({
  origin: [
    "http://localhost:3000",             
    "http://localhost:4000",             
    "https://blog-post-api-alvarez.onrender.com"  
  ],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true
}));

//MongoDB database
mongoose.connect("mongodb+srv://admin:admin@b561-alvarez.gh8mqev.mongodb.net/BlogPostAPI?retryWrites=true&w=majority&appName=B561-Alvarez", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas.'));

//Routes Middleware
const postRoutes = require("./routes/post");
const userRoutes = require("./routes/user");

app.use("/posts", postRoutes);
app.use("/users", userRoutes);

if(require.main === module){
    app.listen(process.env.PORT || port, () => {
        console.log(`API is now online on port ${ process.env.PORT || port }`)
    });
}

module.exports = {app,mongoose};