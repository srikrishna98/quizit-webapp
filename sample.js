var express = require("express");
var mysql = require("mysql");
var bodyParser = require("body-parser");    
var passwordHash = require('password-hash');
var session = require('express-session');


var app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("assets"));
app.set("view engine","ejs");
app.use(session({
    secret: '0GBlJZ9EKBt2Zbi2flRPvztczCewBxXK',
    resave:false,
    saveUninitialized:true
  }));

  // DB CONNECTION
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "srikrishna@1",
    database: "ctf_tech_task"
  });
con.connect(function(err) {
if (err) {throw err;}
con.query("SELECT * FROM user_login", function (err, result, fields) {
    if (err) throw err;
    console.log("QUERY PASSING ENABLED");
});
});  



app.listen(process.env.PORT,function(){
    console.log("Server started!");
});


// GET REQUESTS
app.get("/",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});
app.get('/login', function(req, res){
    res.render('login');
 });
app.get('/play',function(req,res){
    if(!req.session.userid){
        res.redirect('/login');
     }
     else{res.render('play');}
});
app.get('/logout',function(req,res){
    req.session.reset();
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
                // sess=req.session;
                var password=req.body.password;
                var hashedPassword=(arr[0].hash);
                var userid=arr[0].userid;
                var correct=passwordHash.verify(password, hashedPassword);
                
                // login success
                if(correct){
                    // sess.user = req.body.email;
                    // console.log(req.session.user);
                    req.session.userid=userid;
                    res.send({redirect:"/play"});
                }

                //invalid credentials
                else{
                    res.send({message:"Invalid credentials"});
                }            
            }    
    });
    }
 });
 

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