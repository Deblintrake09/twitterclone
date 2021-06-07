const express = require('express');
const app = express();
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require('../schemas/UserSchema');


router.get("/", (req, res, next)=>{ 
    var payload = createPayload(req.session.user);
    res.status(200).render("searchPage", payload);
})

router.get("/:selectedTab", (req, res, next)=>{

    
    var payload = createPayload(req.session.user);
    payload.selectedTab = req.params.selectedTab;
    res.status(200).render("searchPage", payload);
})

function createPayload(userLoggedin){
    return {
        pageTitle: "Search",
        userLoggedIn: userLoggedin,
        userLoggedInJs: JSON.stringify(userLoggedin)

    }
}


module.exports = router;