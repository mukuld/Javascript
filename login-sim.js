/* Javascript programming
Programmer: Mukul Dharwadkar
Date: 02 January 2023 */

"use strict";

function User(){
    var username, password;

    function doLogin(user,pw){
        username = user;
        password = pw;

        if (pw === "shital"){
            console.log("Welcome!");
        }
        else {
            console.log("Wrong password");
        }
    }
    var pubAPI = {
        login: doLogin
    };
    return pubAPI;
}

var mukul = User();

mukul.login("mukul", "shital");