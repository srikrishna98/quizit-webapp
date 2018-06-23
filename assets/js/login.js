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
                    {
                     $('#snackbar')[0].innerText=response.message;
                     myFunction();
                    }    
               }
            }
        );
    });
});
function myFunction() {
    // Get the snackbar DIV
    var x = document.getElementById("snackbar");

    // Add the "show" class to DIV
    x.className = "show";

    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
} 