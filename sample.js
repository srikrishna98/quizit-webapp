var express = require("express");
var mysql = require("mysql");
var bodyParser = require("body-parser");    
var passwordHash = require('password-hash');
var decode = require('unescape');
var session = require('express-session');
var Client = require('node-rest-client').Client;
 
var client = new Client();
var app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("assets"));
app.set("view engine","ejs");
app.use(session({
    secret: '0GBlJZ9EKBt2Zbi2flRPvztczCewBxXK',
    resave:false,
    saveUninitialized:true
  }));
var con;
  // DB CONNECTION
function dbConnect(callback){
  var con = mysql.createConnection({
    host: "us-cdbr-iron-east-04.cleardb.net",
    user: "b1e87b36eb151e",
    password: "0caa14fa",
    database: "heroku_ac3afc1acf45a99"
  });
con.connect(function(err) {
if (err) {throw err;}
con.query("SELECT * FROM user_login", function (err, result, fields) {
    if (err) throw err;
    console.log("QUERY PASSING ENABLED");
});
});  
callback(con);
}



app.listen(process.env.PORT||5000,function(){
    console.log("Server started!");
});


// GET REQUESTS
app.get("/",function(req,res){
    dbConnect(function(result){con=result;})
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});
app.get('/login', function(req, res){
    res.render('login');
 });
app.get('/home',function(req,res){
    if(!req.session.userid){
        res.redirect('/login');
     }
     else
     {res.render('home',{username:req.session.userid});}
});
app.get('/play',function(req,res){
    if(!req.session.userid){
        res.redirect('/login');
     }
     else
     {  req.session.qno=0;
        req.session.score=0;
        res.render('play',{username:req.session.userid});
        }
});
app.get('/get_ques',function(req,res){
    if(req.session.qno<10){
        client.get("https://opentdb.com/api.php?amount=1&category=9&difficulty=easy&type=multiple&token=b7518dcd2ee1d98513dfccdd9c12c8c7c2b832321213167f4a6ca5e0f945bbee", function (data, response) {
        var ques={qno:req.session.qno+1,questions:[],options:[]};
        data.results.forEach(function(Element)
        {
            var options=Element.incorrect_answers;
            var index=Math.floor(Math.random()*4)+1;
            options.splice(index,0,Element.correct_answer);
            ques.questions.push(Element.question);
            ques.options.push(options);
            req.session.ans=decode(Element.correct_answer);
            // console.log(req.session.ans);
        });
        req.session.qno++;
        res.send(ques);
        });
    }
});
app.get('/check_answer',function(req,res){
    if(req.query.answer == req.session.ans)
        {   
         res.send({answer:"True"});
        }
        else{res.send({answer:"False"});}

 });
app.get('/my_scores',function(req,res){
    var sql = "SELECT score,date_format(time_of_test, '%d-%m-%Y') as date,TIME(time_of_test) as time from scores where userid='"+req.session.userid+"'";
    con.query(sql,function(err,result)
    {
     if(err) res.send({message:"internal server error"});
     var arr=(JSON.stringify(result));
    //  console.log(result);
     var arr=JSON.parse(arr);  
     res.send(arr);
    } 
    );
});
app.get('/logout',function(req,res){
    req.session.destroy();
    res.redirect('/login');
}
);

// POST REQUESTS
app.post('/checkid',function(req,res){
    console.log(req.body.userid);
    checkUserExists(req.body.userid,function(result){
        res.send(result);
    })
});
app.post("/register",function(req,res){
    var new_user=req.body;
    var hashedPassword = passwordHash.generate(new_user.password);
    // console.log(checkEmailExists(req.body.email));
    checkEmailExists(req.body.email,function(result){
    if(!result)
    {
        var sql = "INSERT INTO user_login(email,hash,userid) VALUES('"+req.body.email+"','"+hashedPassword+"','"+req.body.userid+"')";
        con.query(sql,function(err,result){
            if(err) throw err
            res.send({redirect:"/"});
        });
    }
    else
        res.send({message:"user exists!!!"});
    });
});

app.post('/login', function(req, res){
    dbConnect(function(result){con=result;});
   if(!req.body.email || !req.body.password){
        res.send({message:"Please enter both id and password"});
    }
    else {
       var sql = "SELECT hash,userid from user_login where email='"+req.body.email+"'";
       con.query(sql,function(err,result)
       {
        if(err) res.send({message:"internal server error"});
        var arr=(JSON.stringify(result));
        var arr=JSON.parse(arr);     
        
        // empty result set
        if(arr.length<=0)
        {res.send({message:"invalid email"})}
        
        //obtained non-empty result set
        else{
                var password=req.body.password;
                var hashedPassword=(arr[0].hash);
                var userid=arr[0].userid;
                var correct=passwordHash.verify(password, hashedPassword);
                
                // login success
                if(correct){
                    req.session.userid=userid;
                    res.send({redirect:"/home"});
                }

                //invalid credentials
                else{
                    res.send({message:"Invalid credentials"});
                }            
            }    
    });
    }
 });
 app.post('/score_persist',function(req,res){
    var sql = "INSERT INTO scores(userid,score) VALUES('"+req.session.userid+"',"+req.body.score+")";
    con.query(sql,function(err,result){
        if(err) throw err
        res.send({score:req.body.score});
    });
 })

// FUNCTIONS

function checkEmailExists(email,callback){
    var sql = "SELECT * from user_login where email='"+email+"'";
    con.query(sql,function(err,result)
    {
        if(err) res.send({message:"invalid"});
        var arr=(JSON.stringify(result));
        var arr=JSON.parse(arr);     
        if(arr.length<=0)
            { callback(false);}
        else
            {callback(true);}   
    });
}

function checkUserExists(userid,callback){
    var sql = "SELECT * from user_login where userid like '"+userid+"'";
    // console.log(sql);
    con.query(sql,function(err,result)
    {
        if(err) res.send({message:"invalid"});
        var arr=(JSON.stringify(result));
        var arr=JSON.parse(arr);     
        console.log(arr);
        if(arr.length<=0)
            { callback(true);}
        else
            {callback(false);}   
    });
}