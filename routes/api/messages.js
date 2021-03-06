const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Chat = require('../../schemas/ChatSchema');
const Message = require('../../schemas/MessageSchema');


app.use(bodyParser.urlencoded({ extended: false }));


router.post("/", async (req, res, next) => {
    if (!req.body.content || !req.body.chatId) {
        console.log("invalid data");
        return res.sendStatus(400);
    }
    let newMessage = {
        sender: req.session.user._id,
        content: req.body.content,
        chat: req.body.chatId
    };

    Message.create(newMessage)
        .then(async message => {
            message = await message.populate("sender").execPopulate();
            message = await message.populate("chat").execPopulate();

            Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message })
                .catch(err => console.log(err))

            res.status(201).send(message);
        })
        .catch(err => {
            console.log(err);
            res.sendStatus(400);
        })

})

router.get("/", async (req, res, next) => {

})


module.exports = router;