"use strict";

const express = require("express");
const session = require("express-session");
const bcrypt = require('bcrypt');
const fs = require("fs");
const app = express();
const port = process.env.Port || 3000;
const dotenv = require('dotenv');
const { env } = require("process");
const pics = ["happy.jpg", "monka.png", "sadge.png"]
const saltRounds = 12;
const MongoStore = require('connect-mongo')

// Stores the user's password and username (in memory database)
var users = [];

/* secret information section */
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

const expireTime = 3600000; //expires after 1 hour  (hours in milliseconds)


dotenv.config({ path: './.env' })

// This is required to make it so anything passed by req is defined.
app.use(express.urlencoded({ extended: false }));


var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://samueljsong:joohundec13@cluster1.cmcs2jt.mongodb.net/test`,
  crypto: {
    secret: mongodb_session_secret
  }
})

//Security reasons
app.use(session({
  secret: "extra text that no one will guess",
  name: "wazaSessionID",
  resave: true,
  saveUninitialized: false
}));

app.use("/img", express.static("./public/img"));


// the req is the URL and the res is the response we give to the website.
// if we have res.send("ANYTHING IN HERE") it will paste that to the URL.
// if we were to specify app.get("/cat/ :id") the is specifying it NEEDS an ID to actually work.
// if you put a questionmark after the id then it specifies that it is not required.

//form actions definition in html of "/loggingin" will have to match with the POST of an app
//such as app.post('/loggingin)

// app.get("/", async(req, res) => { // this example "/" = request that the user put into,
//   let doc = fs.readFileSync("../public/html/landing.html", "utf-8"); //Storing the 'landing' html page to doc
//   res.send(doc); // Sending the doc as the respond.
// }); // The URL will now say localhost:3000/landing


app.get("/", async(req, res) => {

  var html = `
    <form action='/login' method='get'>
        <button id = 'login'>Log in</button>
    </form>
    <form action='/signup' method='get'>
        <button id = 'signup'>Sign up</button>
    </form>
  `
  res.send(html)
})

app.get("/signup", async(req, res) => {
  var html = `
  <form action = '/createUser' method = 'post'>
      <p id = 'text'>Create User<p>
      <input name='name' type='text' placeholder='name'><br>
      <input name='email' type='text' placeholder='email'><br>
      <input name='password' type='password' placeholder='password'><br>
      <button>Submit</button>
  </form>
  `
  res.send(html)
})

app.post("/createUser", async(req, res) => {

  var email = req.body.email;
  var password = req.body.password;
  var name = req.body.name;
  
  if (email == 0 || password == 0 || name == 0) {
    res.redirect("/signup")
  } else {
    var hashedPassword = bcrypt.hashSync(password, saltRounds)

    users.push({ email: email, password: hashedPassword, name: name });
    console.log(users)

    res.redirect("/")
  }
})

app.get("/login", async(req, res) => {
  var html = `
  <form action = '/loggingin' method = 'post'>
      <p id = 'text'>Log in<p>
      <input name='email' type='text' placeholder='email'><br>
      <input name='password' type='password' placeholder='password'><br>
      <button>Submit</button>
  </form>
  `
  res.send(html)
})

app.post("/loggingin", async(req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  var usershtml = "";
  for (let i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      if (bcrypt.compareSync(password, users[i].password)) {
        req.session.authenticated = true;
        // req.session.email = email;
        req.session.cookie.maxAge = expireTime;
        req.session.username = users[i].name

        res.redirect('/loggedIn');
        return;
      }
    }
  }

  res.redirect('/')

})


app.get('/loggedin', (req, res) => {
  if (!req.session.authenticated) {
    res.redirect('/login');
  }
  var username = req.session.username

  var html = `
  <p>Hello ` + username + `</p>
  <form action = "/members" method = "get">
    <button>Go to Members Area</button>
  </form>
  <form action = "/logout" method = "get">
    <button>Logout</button>
  </form>
  `;
  res.send(html);
});


app.get("/members", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect('/login');
  }

  var username = req.session.username

  var path = pics[Math.floor(Math.random() * 3)]
  console.log(path)
  var html = `
  <style>
    img {
      width: 300px;
      height: 300px;
    }
  </style>
  <h1>Hello, ` + username + `</h1><br>
  <img id = pic src="/img/` + path + `" alt="none"><br>
  <form action = "/logout" method = "get">
    <button id = 'signout'>Sign Out</button>
  </form>
  `
  res.send(html)
})

app.get('/logout', async(req, res) => {

  req.session.destroy();
  res.redirect("/")
})


// res codes is important becuase it will help during web developing. (200, 300, 404, 500...)
// The '*' is a 'catch all reference. if the URL, which is req, is not any of the defined request pages
// it will reach this catch all statment meaning that it will then show the 404.
app.get("*", async(req, res) => {
  res.status(404);
  res.send("Page not found - 404");
})

//res.redirect is going to automatically put the site in res code 300 which will enable people to redirect the page.

// listen is basically running the npm
app.listen(port, () => {
  console.log("server running on port 3000");
});
