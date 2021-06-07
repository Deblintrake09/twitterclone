const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Chat = require('../../schemas/ChatSchema');
const Message = require('../../schemas/MessageSchema');


app.use(bodyParser.urlencoded({ extended: false }));


router.post("/", async (req, res, next) => {
    if (!req.body.users) {
        console.log("Users param not sent with request");
        return res.sendStatus(400);
    }
    let users = JSON.parse(req.body.users);
    if (users.legth == 0) {
        console.log("User array empty");
        return res.sendStatus(400);
    }
    users.push(req.session.user);

    let chatData = {
        users: users,
        isGroupChat: true
    };

    Chat.create(chatData)
        .then(chat => res.status(200).send(chat))
        .catch(err => {
            console.log(err);
            res.sendStatus(400);
        })

})

router.get("/", async (req, res, next) => {
    //checks database for a chat that any of it users id equals the current
    //session user id
    Chat.find({ users: { $elemMatch: { $eq: req.session.user._id } } })
        .populate("users")
        .populate("latestMessage")
        .sort({updatedAt:-1})
        .then(async (results) => {
            results = await User.populate(results, {path:"latestMessage.sender"});
            res.status(200).send(results);
        })
        .catch(err => {
            console.log(err);
            res.sendStatus(400);
        })
})

router.get("/:chatId", async (req, res, next) => {
    Chat.findOne({ _id:req.params.chatId, users: { $elemMatch: { $eq: req.session.user._id } } })
        .populate("users")
        .then(results => res.status(200).send(results))
        .catch(err => {
            console.log(err);
            res.sendStatus(400);
        })
})

router.put("/:chatId", async (req, res, next) => {
    Chat.findByIdAndUpdate(req.params.chatId, req.body)
        .then(results => res.sendStatus(204))
        .catch(err => {
            console.log(err);
            res.sendStatus(400);
        })
})

router.get("/:chatId/messages", async (req, res, next) => {
    Message.find({chat:req.params.chatId})
        .populate("sender")
        .then(results => res.status(200).send(results))
        .catch(err => {
            console.log(err);
            res.sendStatus(400);
        })
})

module.exports = router;