const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const port = 4000;

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));


const corsOptions = {
    origin: [
    "http://localhost:3000",             
    "http://localhost:4000",             
    "https://blog-post-api-alvarez.onrender.com" ,
    "https://blog-post-client-alvarez.vercel.app" 
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));


//MongoDB database
mongoose.connect(process.env.MONGODB_STRING);

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