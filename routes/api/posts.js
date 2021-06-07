const express = require('express');
const app = express();
const router = express.Router();
const bodyParser= require('body-parser');
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');


app.use(bodyParser.urlencoded({extended:false}));


router.get("/", async (req, res, next)=>{

    var searchObj = req.query;
    if(searchObj.isReply !== undefined){
        var isReply= searchObj.isReply == "true";
        searchObj.replyTo = {$exists : isReply};
        delete searchObj.isReply;       // removes this from the object because it is not in userSchema
    }
    
    if(searchObj.search !==undefined){
        searchObj.content = {$regex: searchObj.search, $options: "i"};
        delete searchObj.search;
    }

    //Controls if you want to get only posts from people you are
    //following. Also addes the user, so in Home you show your own
    //posts and those of users you follow
    if(searchObj.followingOnly !== undefined){
        var followingOnly = searchObj.followingOnly == "true";

        if (followingOnly){
            
            var objectIds= [];
            if(!req.session.user.following){    //If has no following array, create an empty one
                req.session.user.following=[];
            }
            req.session.user.following.forEach(user=>{
                objectIds.push(user);
            });
            objectIds.push(req.session.user._id); //remove line to remove own posts from newsfeed
            searchObj.postedBy = {$in : objectIds};    
        }
        
        delete searchObj.followingOnly; // removes this from the object because it is not in userSchema

    }
    var results= await getPosts(searchObj);

    res.status(200).send(results);  

})

router.get("/:id", async(req, res, next)=>{
    
    var postId= req.params.id;
    
    var postData= await getPosts({_id:postId});
    postData = postData[0];
    var results={
        postData: postData
    }
    if(postData.replyTo !== undefined)
    {
        results.replyTo = postData.replyTo;
    }
    results.replies= await getPosts({replyTo: postId})

    res.status(200).send(results);  


})

router.post("/", async (req, res, next)=>{
    
    if(!req.body.content){
        console.log("Content Not sent with request");
        return res.sendStatus(400);
    }
    var postData={
        content: req.body.content,
        postedBy: req.session.user
    }

    if(req.body.replyTo){
        postData.replyTo = req.body.replyTo;
    }
    Post.create(postData)
    .then(async (newPost)=>{
        newPost=await User.populate(newPost, {path:"postedBy"});
        res.status(201).send(newPost);
    })
    .catch((error)=>{
        console.log(error);
        res.sendStatus(400);
    })
})

router.put("/:id/like", async (req, res, next)=>{
    var postId=req.params.id;
    var userId=req.session.user._id;

    var isLiked= req.session.user.likes && req.session.user.likes.includes(postId);

    var option = isLiked ? "$pull" : "$addToSet";

    //Insert user like
    req.session.user = await User.findByIdAndUpdate(userId, { [option] : { likes : postId } }, {new: true}) // use square brackets to inject a variable  // new:true devuelve el objeto modificado
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })    
    //Insert post like
    var post = await Post.findByIdAndUpdate(postId, { [option] : { likes : userId } }, {new: true})
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })    
    
    
    res.status(200).send(post);
})

//Handle Retweet Posts
router.post("/:id/retweet", async (req, res, next)=>{
        
    var postId=req.params.id;
    var userId=req.session.user._id;

    //Try and delete retweet
    var deletedPost =await Post.findOneAndDelete({postedBy:userId, retweetData:postId})
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })    

    var option = deletedPost !=null ? "$pull" : "$addToSet";
    var repost = deletedPost;

    if(repost==null){
        repost = await Post.create({postedBy:userId, retweetData: postId})
        .catch(error=>{
            console.log(error);
            res.sendStatus(400);
        })    
    }
    
    //Insert user retweet
    req.session.user = await User.findByIdAndUpdate(userId, { [option] : { retweets : repost._id } }, {new: true})
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })    
    //Insert post retweet
    var post = await Post.findByIdAndUpdate(postId, { [option] : { retweetUsers : userId } }, {new: true})
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })    
    
    
    res.status(200).send(post);
})

router.delete("/:id", (req, res, next)=>{
    
    Post.findByIdAndDelete(req.params.id)
    .then(()=>res.sendStatus(202))
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })
})

router.put("/:id", async (req, res, next)=>{
    if(req.body.pinned !== undefined){
        await Post.updateMany({postedBy: req.session.user}, {pinned: false})
        .catch(error =>{
            console.log(error);
            res.sendStatus(400);
        });
    }
    Post.findByIdAndUpdate(req.params.id, req.body)
    .then(()=>res.sendStatus(204))
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })
})


async function getPosts(filter){
    
    var results = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")
    .sort({"createdAt": -1})
    .catch(error=>console.log(error))
    results = await User.populate(results, {path:"replyTo.postedBy"});
    return await User.populate(results, {path:"retweetData.postedBy"});
    

}


module.exports = router;