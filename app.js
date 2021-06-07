const express = require('express');
const bodyParser = require('body-parser');
const middleware = require('./middleware');
const path = require('path')
const app = express();
const port = 3003;
const mongoose = require("./database"); // creates connection
const session = require("express-session");

const server = app.listen(port, () => console.log("Server listenting on port " + port));
const io = require("socket.io")(server, { pingTimeout: 60000 });

app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({ secret: "superduperchat", resave: true, saveUninitialized: false }))

//Routes
const loginRoute = require('./routes/loginRoutes');
const logoutRoute = require('./routes/logoutRoutes');
const registerRoute = require("./routes/registerRoutes");
const postRoute = require("./routes/postRoutes");
const profileRoute = require("./routes/profileRoutes");
const uploadRoute = require("./routes/uploadRoutes");
const searchRoute = require("./routes/searchRoutes");
const messagesRoute = require("./routes/messagesRoutes");

app.use("/login", loginRoute);
app.use("/register", registerRoute);
app.use("/logout", logoutRoute);
app.use("/post", middleware.requireLogin, postRoute);
app.use("/profile", middleware.requireLogin, profileRoute);
app.use("/uploads", uploadRoute);
app.use("/search", middleware.requireLogin, searchRoute);
app.use("/messages", middleware.requireLogin, messagesRoute);

//API Routes
const postsAPIRoute = require('./routes/api/posts');
const usersAPIRoute = require('./routes/api/users');
const chatsAPIRoute = require('./routes/api/chats');
const messagesAPIRoute = require('./routes/api/messages');

app.use("/api/posts", postsAPIRoute);
app.use("/api/users", usersAPIRoute);
app.use("/api/chats", chatsAPIRoute);
app.use("/api/messages", messagesAPIRoute);



app.get("/", middleware.requireLogin, (req, res, next) => {

    let payload = {
        pageTitle: "Home",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user), // Convierte el usuario a string para poder pasarlo en llamadas de JS
    }
    res.status(200).render("home", payload);
})


//MANAGE SOCKET IO connection
io.on("connection", (socket) => {
    console.log("connected");
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    })

    socket.on("join room", room =>socket.join(room));
    socket.on("typing", room =>socket.in(room).emit("typing"));
})

