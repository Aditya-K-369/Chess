const express = require("express");
const socket = require("socket.io");
const http = require('http');
const path = require('path');
const {Chess} = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();

let players ={}
let currentPlayer = "";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index",{ title : "Chess Game"});
});

io.on("connection",(uniquesocket)=>{
    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w")
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole","b")
    }
    else{
        uniquesocket.emit("spectatorRole")
    }

    uniquesocket.on("disconnected",(uniquesocket)=>{
        if(uniquesocket.id==players.white){
            delete players.white;
        }
        else if(uniquesocket.id == players.black){
            delete players.black
        }
    });
    uniquesocket.on("move",(move)=>{
        try{
            if(players.white !==uniquesocket.id && chess.turn()=="w") return;
            if(players.black !==uniquesocket.id && chess.turn()=="b") return;
            
            const result = chess.move(move);

            if(result){
                currentPlayer = chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen());     
            }
            else{
                uniquesocket.emit("invalidMove",move);
            }
        }
        catch(err){
            uniquesocket.emit("invalidMove",move);

        }

    });


});


server.listen(3000);