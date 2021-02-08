const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const mongodb = require("mongodb")
var bcryptjs = require("bcryptjs");
var nodemailer = require("nodemailer");
const mongoClient = mongodb.MongoClient;
const cors = require("cors");
require('dotenv').config();
//const url = "mongodb+srv://Tnahsin79:tnahsin79@guvi-zen.iisub.mongodb.net?retryWrites=true&w=majority";
const url = "mongodb+srv://Tnahsin79:tnahsin79@guvi-capstone.iisub.mongodb.net?retryWrites=true&w=majority";
app.use(bodyParser.json());
app.use(cors({
  origin: "http://localhost:3000"
}));

console.log("server started...");

//GET users listing. 
app.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

app.post("/signup", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("invoice");
    var user;
    if (req.body.Type === "A")
      user = await db.collection("admins").findOne({ Email: req.body.Email });
    if (req.body.Type === "M")
      user = await db.collection("managers").findOne({ Email: req.body.Email });
    if (req.body.Type === "E")
      user = await db.collection("employees").findOne({ Email: req.body.Email });
    if (!user) {
      //generate salt
      let salt = await bcryptjs.genSalt(10);
      //hash password
      let hash = await bcryptjs.hash(req.body.Password, salt);
      //store in db
      req.body.Password = hash;
      if (req.body.Type === "A")
        user = await db.collection("admins").insertOne(req.body);
      if (req.body.Type === "M")
        user = await db.collection("managers").insertOne(req.body);
      if (req.body.Type === "E")
        user = await db.collection("employees").insertOne(req.body);
      res.json({
        message: "User Registered!"
      });
      /*var link = `http://localhost:3000/valid/${req.body.Type}/${user.insertedId}`;
      //req.body=req.body.json();
      var data = `
      <p>you have registration requst</p>
      <h3>Validating link</h3>
      <p>${link}<p>
      `;
      let transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        //port: 465,
        //secure: true, // true for 465, false for other ports
        auth: {
          user: "webdevtesting79@gmail.com", // generated ethereal user
          pass: "tsukuyomi79" // generated ethereal password
        }
      });

      let mailOptions = {
        from: "webdevtesting79@gmail.com", // sender address
        to: req.body.Email, // list of receivers
        subject: "testing...", // Subject line
        text: "Hello world.......", // plain text body
        html: data // html body
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("error: " + error);
        }
        else {
          console.log("Message sent: %s", info.messageId);
          console.log("email sent: %s", info.response);
          //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
      });*/
    }
    else {
      alert("Email aleady registrered!");
    }
  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.put("/valid", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("invoice");
    var user = await db.collection("user").findOne({ _id: mongodb.ObjectID(req.body.Id) });
    if (user.isActivated === false) {
      await db.collection("user")
        .findOneAndUpdate(
          { _id: mongodb.ObjectID(req.body.Id) },
          {
            $set: {
              isActivated: true
            }
          }
        );
      res.json({
        message: "Account activated"
      });
    }
    else {
      res.json({
        message: "Account activated already!"
      });
    }

  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.get("/login/:email/:pwd/:type", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("invoice");
    //find the user with email
    var user;
    if (req.params.type === "A")
      user = await db.collection("admins").findOne({ Email: req.params.email });
    if (req.params.type === "M")
      user = await db.collection("managers").findOne({ Email: req.params.email });
    if (req.params.type === "E")
      user = await db.collection("employees").findOne({ Email: req.params.email });
    if (user) {
      //comapare the password
      var result = await bcryptjs.compare(req.params.pwd, user.Password);
      if (result) {
        //alert("ACCESS GRANTED :)");
        res.json({
          status: true,
          id: user._id,
          fname: user.Fname,
          lname: user.Lname,
          email: user.Email,
          type: user.Type
        });
      }
      else {
        //alert("ACCESS DENIED :( (incorrect username/password");
        res.json({
          status: false,
          message: "wrong email or password"
        });
      }
    }
    else {
      //alert("No such user exists, kindly register yourself!!!!");
      res.json({
        status: false,
        message: "No such user exists, kindly register yourself!!!! or activate account"
      });
    }
  }
  catch (error) {
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.post("/adduser", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("invoice");
    var user = await db.collection("users").findOne({ Email: req.body.Email });
    if (!user) {
      user = await db.collection("users").insertOne(req.body);
      res.json({
        message: "User Registered!"
      });
    }
    else {
      res.json({
        message: "Email aleady registrered!"
      });
    }
  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.put("/addinvoice", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("invoice");
    var user = await db.collection("users").findOne({ Email: req.body.CEmail });
    if (user) {
      let invoices = user.Invoices;
      invoices.push(req.body);
      await db.collection("users")
        .findOneAndUpdate(
          { Email: req.body.CEmail },
          {
            $set: {
              Invoices: invoices
            }
          }
        );
      res.json({
        message: "Invoice created"
      });
    }
    else {
      res.json({
        message: "Invoice not added"
      });
    }

  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.get("/getUser/:email", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("invoice");
    //find the user with email
    var user = await db.collection("users").findOne({ Email: req.params.email });
    if (user) {
      res.json({ user });
    }
  }
  catch (error) {
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.get("/user/:id", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("invoice");
    //find the user with email
    var user = await db.collection("users").findOne({ _id: mongodb.ObjectID(req.params.id) });
    if (user) {
      res.json({ user });
    }
  }
  catch (error) {
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

/*
app.get('/profile/:id', async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("react-login");
    var user = await db.collection("user").findOne({ _id: mongodb.ObjectID(req.params.id) });
    //var user = await db.collection("user").findOne({ _id: mongodb.ObjectID(req.body.Id) });
    res.json(user);
  }
  catch (error) {
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.get('/friends/:id', async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("react-login");
    var user = await db.collection("user").findOne({ _id: mongodb.ObjectID(req.params.id) });
    res.json(user.Friends);
  }
  catch (error) {
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.put("/addPost", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("react-login");
    var user = await db.collection("user").findOne({ _id: mongodb.ObjectID(req.body.Id) });
    if (user) {
      let posts = user.Posts;
      let id = posts.length + 1;
      posts.push({
        post_id: req.body.Id + "-" + id,
        name: req.body.Name,
        //media: req.body.Media,
        text: req.body.Text,
        likes: []
      });
      await db.collection("user")
        .findOneAndUpdate(
          { _id: mongodb.ObjectID(req.body.Id) },
          {
            $set: {
              Posts: posts
            }
          }
        );
      res.json({
        message: "Post Added"
      });
    }
    else {
      console.log("Post not added");
    }

  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.get('/users', async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("react-login");
    var users = await db.collection("user").find().toArray();
    res.json(users);
  }
  catch (error) {
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.put("/addFriend/:id", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("react-login");
    var user = await db.collection("user").findOne({ _id: mongodb.ObjectID(req.params.id) });

    let friends = user.Friends;
    friends.push({
      email: req.body.Email,
      name: req.body.Name
    });
    await db.collection("user")
      .findOneAndUpdate(
        { _id: mongodb.ObjectID(req.params.id) },
        {
          $set: {
            Friends: friends
          }
        }
      );
    res.json({
      message: "Post Added"
    });


  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.get('/posts/:id', async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var result = [];
    var db = client.db("react-login");
    var temp = await db.collection("user").findOne({ _id: mongodb.ObjectID(req.params.id) });
    result.push(...temp.Posts);
    var friends = temp.Friends;
    for (let i = 0; i < friends.length; i++) {
      let user = await db.collection("user").findOne({ Email: friends[i].email });
      result.push(...user.Posts);
    }
    res.json(result);
  }
  catch (error) {
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.put("/likes/:id", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("react-login");
    var user = await db.collection("user").findOne({ _id: mongodb.ObjectID(req.params.id) });
    let posts = user.Posts;
    let post = posts[req.body.index - 1];
    if (req.body.type)
      post.likes.push(req.body.likerId);
    else
      post.likes.splice(post.likes.indexOf(req.body.likerId), 1);
    posts[req.body.index - 1] = post;

    await db.collection("user")
      .findOneAndUpdate(
        { _id: mongodb.ObjectID(req.params.id) },
        {
          $set: {
            Posts: posts
          }
        }
      );
    res.json(post);
  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.put("/deletePost", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("react-login");
    var user = await db.collection("user").findOne({ _id: mongodb.ObjectID(req.body.UserId) });
    let posts = user.Posts;
    posts.splice(req.body.index - 1, 1);
    await db.collection("user")
      .findOneAndUpdate(
        { _id: mongodb.ObjectID(req.body.UserId) },
        {
          $set: {
            Posts: posts
          }
        }
      );
    res.json({
      message: "post deleted"
    });
  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    })
  }
});

app.put("/updatePost", async function (req, res) {
  try {
    var client = await mongoClient.connect(url);
    var db = client.db("react-login");
    var user = await db.collection("user").findOne({ _id: mongodb.ObjectID(req.body.UserId) });
    let posts = user.Posts;
    posts[req.body.index - 1].text = req.body.changeText;
    await db.collection("user")
      .findOneAndUpdate(
        { _id: mongodb.ObjectID(req.body.UserId) },
        {
          $set: {
            Posts: posts
          }
        }
      );
    res.json({
      message: "post updated"
    });
  }
  catch (error) {
    console.log("ERROR: " + error);
    res.json({
      message: "Something went wrong: " + error
    })
  }
});*/

const port = process.env.PORT || 3001;
app.listen(port);