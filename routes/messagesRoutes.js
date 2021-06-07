const express = require('express');
const mongoose = require('mongoose');
const app = express();
const router = express.Router();
const User = require('../schemas/UserSchema');
const Chat = require('../schemas/ChatSchema');


router.get("/", (req, res, next) => {
    res.status(200).render("inboxPage", {
        pageTitle: "Inbox",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    });
})

router.get("/new", (req, res, next) => {
    res.status(200).render("newMessage", {
        pageTitle: "New message",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    });
})

router.get("/:chatId", async (req, res, next) => {
    let userId = req.session.user._id;
    let chatId = req.params.chatId;
    var isValidId = mongoose.isValidObjectId(chatId);
    var payload = {
        pageTitle: "Chat",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    }
    if (!isValidId) {
        payload.errorMessage = "Chat does not exist or you do not have permission to view it";
        res.status(200).render("chatPage", payload);
    }
    let chat = await Chat.findOne({ _id: chatId, users: { $elemMatch: { $eq: userId } } })
        .populate("users");
    if (chat == null) {
        let userFound = await User.findById(chatId);
        if (userFound != null) {
            chat = await getChatByUserId(userFound._id, userId);
        }

    }
    if (chat == null) {
        payload.errorMessage = "Chat does not exist or you do not have permission to view it";
    } else {
        payload.chat = chat;
    }
    res.status(200).render("chatPage", payload);
});

function getChatByUserId(userLoggedInID, otherUserId) {
    return Chat.findOneAndUpdate({ // Finds or creates a chat that is NOT a Group Chat
        isGroupChat: false,          // has 2 users in it
        users: {                     // and the id of those 2 users are the ones passed in the parameters
            $size: 2,
            $all: [
                { $elemMatch: { $eq: mongoose.Types.ObjectId(userLoggedInID) } },
                { $elemMatch: { $eq: mongoose.Types.ObjectId(otherUserId) } }
            ]
        }
    }, {    //if chat was not found it will create a new one and add the IDs as the users
        $setOnInsert:{
            users:[ userLoggedInID, otherUserId ],
        }
    },{ // It will return the new chat if it was created
        new: true,
        upsert: true
    })
    .populate("users");
}

module.exports = router;