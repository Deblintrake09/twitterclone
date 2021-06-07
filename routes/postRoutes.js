const express = require('express');
const router = express.Router();

router.get("/:id", (req, res, next)=>{

    
    var payload ={
        pageTitle:"View Post",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user), // Convierte el usuario a string para poder pasarlo en llamadas de JS
        postId : req.params.id
    }
    res.status(200).render("postPage", payload);
})


module.exports = router;