console.log("connected");
$(document).ready(function(){
    $('#login_button').click(function(){
        var email=$('#email')[0].value;
        var pwd=$('#password')[0].value;
        // console.log(email+" "+)
        $.ajax(
            {url:"/login",
             type:"POST",
             data:{email:email,password:pwd},
             success:function(response){
                 if(typeof (response.redirect) == 'string')
                    {
                        window.location=response.redirect;
                    }
                 else
                    {var message=$('#message')[0];
                     message.innerText=response.message;
                    }    
               }
            }
        );
    });
});