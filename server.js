const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

// Connect to mongo DB
mongoose.connect("mongodb://localhost:27017/auth", {useNewUrlParser: true, useUnifiedTopology: true});
// New user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
// New article schema
const articleSchema = new mongoose.Schema({
  title: String,
  content: String
});
// New user model
const User = new mongoose.model('user', userSchema);
// New article model
const Article = new mongoose.model('article', articleSchema);

// REST API to manage all articles/posts.
app.route('/articles')
// Get Request
.get(authenticateToken, (req, res)=>{
  Article.find((err, articles)=>{
    if (!err) res.send(articles);
    else res.send(err);
  });
})
// Post Request
.post(authenticateToken, (req, res)=>{
  // Get the data
  const title = req.body.title;
  const content = req.body.content;
  // Check if the data(s) are not empty
  if (title && content){
    // Insert data(s) to database
    newArticle = new Article({
      title: title,
      content: content
    });
    newArticle.save((err)=>{
      if(!err) res.send("Successfully added new article");
      else console.log(err);
    });
  }else res.send("Can not enter empty values. Please enter 'title' and 'content'");
})
// Delete Request (To delete all articles)
.delete(authenticateToken, (req, res)=>{
  Article.deleteMany((err)=>{
    if(!err) res.send("Successfully deleted all items.");
    else res.send(err);
  });
});


// API to manage a specific post/article.
app.route("/articles/:articleTitle")
// Get Request
.get(authenticateToken, (req, res)=>{
  Article.findOne({title: req.params.articleTitle}, (err, article)=>{
    if(!err){
      if(article){
        res.send(article);
      } else res.send("Nothing found with that title. Make sure you don't have any typos.");
    }else res.send("Something went wrong! Error is: - " + err);
  });
})
// Put Request (To update article)
.put(authenticateToken, (req, res)=>{
  Article.update(
    {title: req.params.articleTitle},
    {title: req.body.title, content: req.body.content},
    {overwrite: true},
    (err)=>{
      if(!err) res.send("Successfully updated the data.");
      else res.send(err);
    }
  );
});


// Home page
app.get("/", (req, res)=>{
  res.render('home');
});

// Login the user and generate JWT.
app.route('/login')
// Get request
.get((req, res)=>{
  res.render('login');
})
// Post request
.post((req, res)=>{
  User.findOne({email: req.body.username}, (err, user)=>{
    if (!err) {
      if(user){
        if(user.password == req.body.password){
          const details = {
            id: user._id,
            email: user.email
          };
          const accessToken = jwt.sign(details, 'Thisissecretkey');
          res.render('secrets', {token: accessToken});
        }else console.log("Password didn't matched");
      }else console.log("User Not found");
    }else console.log(err);
  });
});

// Register new users and generate JWT.
app.route("/register")
// Get request
.get((req, res)=>{
  res.render('register');
})
// Post request
.post((req, res)=>{
  newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save((err, obj)=>{
    if(!err){
      const details = {
        id: obj._id,
        email: obj.email
      };
      const accessToken = jwt.sign(details, 'Thisissecretkey');
      res.render('secrets', {token: accessToken});
    }else console.log(err);
  });
});

function authenticateToken(req, res, next){
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, 'Thisissecretkey', (err, user)=>{
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Server listening on port 3000
app.listen("3000", ()=>{
  console.log("Listening on port 3000.");
});
