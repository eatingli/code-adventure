require('source-map-support').install()
import * as path from 'path'
import * as http from 'http'
import * as express from 'express'
import * as socketio from 'socket.io'
import * as Game from './game.js'
import * as Config from './game-config'
import GameService from './game-service.js'

const app = express();
const httpServer = new http.Server(app);
const io = socketio(httpServer);


let gameService = new GameService()
gameService.start();

gameService.on(Config.Event.GEN_RESOURCE, (r) => {
    // console.log('GEN_RESOURCE', r);
    io.emit(Config.Event.GEN_RESOURCE, JSON.stringify(r))
})

gameService.on(Config.Event.GEN_MONSTER, (m) => {
    // console.log('GEN_MONSTER', m);
    // console.log(`New Res: ${m.c} (${m.p.x}, ${m.p.y}) ${time} ${qty}`)
    io.emit(Config.Event.GEN_MONSTER, JSON.stringify(m))
})

gameService.on(Config.Event.PROFIT_MONEY, () => {
    let moneys = gameService.getData().roles.map((r) => r.money)
    console.log('PROFIT_MONEY', moneys);
})

gameService.on(Config.Event.PROFIT_RESOURCE, () => {
    let { iron, wood, food } = gameService.getData().storage
    console.log('PROFIT_RESOURCE', iron, wood, food);
})

gameService.on(Config.Event.NEW_QUEST, (nq) => {

    console.log('NEW_QUEST', nq);
})



io.on('connection', function (socket) {
    console.log('A user connected');
    socket.emit('INIT', JSON.stringify(gameService.getData()))

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    // setInterval(() => {
    //     io.emit(Config.Event.GEN_MONSTER, '1')
    // }, 10)
    socket.on('test', function (msg: string) {
        // console.log(msg)
        // io.emit('test', msg)
    })
});


let www = path.join(__dirname, '..', 'www');
app.use(express.static(www));

// app.get('/move', function (req, res) {

// });

// app.get('/search', function (req, res) {

// })

// app.get('/atk', function (req, res) {

// })

// app.get('/collect', function (req, res) {

// })

// app.get('/self', function (req, res) {

// })

// app.get('/quest', function (req, res) {

// })

// app.get('/submit', function (req, res) {

// })

// app.get('/buy', function (req, res) {

// })

// app.get('/sell', function (req, res) {
// })

// app.get('/shop', function (req, res) {

// })

// app.get('/refreshShop', function (req, res) {

// })

// app.get('/map', function (req, res) {

// })


httpServer.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

// Test print game world
setInterval(() => {
    // console.log(gameService.resources)
}, 100)
