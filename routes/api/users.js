const express = require('express');
const app = express();
const router = express.Router();
const bodyParser= require('body-parser');
const multer = require("multer");
const path = require ("path");
const fs = require("fs");
const upload = multer({ dest: "uploads/" });
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');


app.use(bodyParser.urlencoded({extended:false}));

router.get("/", async (req,res,next)=>{
    var searchObj = req.query;
    if(req.query.search !== undefined){
        searchObj={
            $or: [
                {firstName: {$regex: searchObj.search, $options: "i"}},
                {lastName: {$regex: searchObj.search, $options: "i"}},
                {userName: {$regex: searchObj.search, $options: "i"}}
            ]
        }
    }
    User.find(searchObj)
    .then(results=>{
        res.status(200).send(results);
    })
    .catch(error=>{
            console.log(error);
            res.send(400);
    })
})

router.put("/:userId/follow", async (req, res, next)=>{
    
    var userId = req.params.userId;
    var user = await User.findById(userId);
    
    if(user == null){
        return res.sendStatus(404);
    }
    var isFollowing =user.followers && user.followers.includes(req.session.user._id); //Checks if the user logged in is following the user
    var option = isFollowing ? "$pull": "$addToSet";
    
    // Add/remove user from followed list
    req.session.user = await User.findByIdAndUpdate(req.session.user._id, { [option] : { following : userId } }, {new: true}) // use square brackets to inject a variable  // new:true devuelve el objeto modificado
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })
    //add/remove user from followers list of the user the current user is un/following
    User.findByIdAndUpdate(userId, { [option] : { followers : req.session.user._id } }) // use square brackets to inject a variable  // new:true devuelve el objeto modificado
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })
    res.status(200).send(req.session.user);
})

router.get("/:userId/followers", async (req, res, next)=>{
    User.findById(req.params.userId)
    .populate("followers")
    .then(results=>{
        res.status(200).send(results);
    })
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })
});

router.get("/:userId/following", async (req, res, next)=>{
    User.findById(req.params.userId)
    .populate("following")
    .then(results=>{
        res.status(200).send(results);
    })
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })
});

router.post("/profilePicture", upload.single("croppedImage"), async (req, res, next)=>{
    if(!req.file){
        console.log("No file uploaded with ajax reques.");
        return res.sendStatus(400);
    }

    var filePath = `/uploads/images/${req.file.filename}.png`;
    var tempPath = req.file.path;
    var targetPath = path.join(__dirname, `../../${filePath}`);
    fs.rename(tempPath, targetPath, async error=>{
        if(error != null){
            console.log(error);
            return res.sendStatus(400);
        }
        req.session.user = await User.findByIdAndUpdate(req.session.user._id,{ profilePic: filePath}, { new: true});
        res.sendStatus(204);
    });
});

router.post("/coverPhoto", upload.single("croppedImage"), async (req, res, next)=>{
    if(!req.file){
        console.log("No file uploaded with ajax reques.");
        return res.sendStatus(400);
    }

    var filePath = `/uploads/images/${req.file.filename}.png`;
    var tempPath = req.file.path;
    var targetPath = path.join(__dirname, `../../${filePath}`);
    fs.rename(tempPath, targetPath, async error=>{
        if(error != null){
            console.log(error);
            return res.sendStatus(400);
        }
        req.session.user = await User.findByIdAndUpdate(req.session.user._id,{ coverPhoto: filePath}, { new: true});
        res.sendStatus(204);
    });
});


module.exports = router;