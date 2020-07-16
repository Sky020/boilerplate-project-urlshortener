 'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
var cors = require('cors');
const dns = require('dns');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true}, ()=> console.log("DB Connected..."));

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
})

const URL = mongoose.model('URL',urlSchema)

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.route('/api/shorturl/new').post((req,res)=> {
  console.log("REQ: ",req.body.url)
  const reqURL = req.body.url;
  URL.find({}, (error,docs) => {
    if (error) return console.log("DB find Error!");
    const numDocs = docs.length;
    for (let doc in docs) {
      console.log("DOC: ",doc, numDocs);
      if (doc.original_url === reqURL) {
        return res.json(doc);
      }
    }
    dns.lookup(reqURL.replace(/(http|https):\/\//, ''), (err,add,fam) => {
      if (err) return res.json({"error": "invalid URL"});
      const newURL = new URL({original_url: reqURL, short_url: numDocs+1})
      URL.create(newURL, (er, mod) => {
        if (er) return console.log("DB create Error!");
        return res.json(newURL);
      });
    })
  });
});

app.route('/api/shorturl/:num?').get((req,res)=> {
  console.log("NUM: ",req.params.num, typeof req.params.num);
  if (!isNaN(req.params.num)) {
  URL.find({short_url: Number(req.params.num)}, (err, doc)=> {
    if (err) return console.log("DB num Error: ",err);
    console.log("DOC",doc);
    return res.redirect(doc[0].original_url);
  })
  } else {
    res.json({"error": "invalid parameter"})
  }
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});