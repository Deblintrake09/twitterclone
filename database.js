/* require('mongoose') returns a Singleton Object
the first time it is called, it creates an instance of the class and
returns it. On subsequent calls, it will return the same instance
that was already created. This is how import/export works in ES6*/ 

const mongoose = require("mongoose");
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false);

class Database{
    
    constructor(){
        this.connect();
    }
    
    connect(){
        mongoose.connect("mongodb+srv://admin:Zo3Lx3zmflokFCmY@cluster0.uex9l.mongodb.net/TwitterCloneDB?retryWrites=true&w=majority")
        .then(()=>{
            console.log("connection succesful");
        })
        .catch((err)=>{
            console.log("connection failed"+err);
        })
    }
}

module.exports= new Database();