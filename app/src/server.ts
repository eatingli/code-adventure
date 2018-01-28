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

let www = path.join(__dirname, '..', 'www');
app.use(express.static(www));

let gameService = new GameService()
gameService.start();

gameService.on(Config.Event.GEN_RESOURCE, (r) => {
    // console.log('GEN_RESOURCE', r);
    let data = {
        role: r,
    }
    io.emit(Config.Event.GEN_RESOURCE, JSON.stringify(data))
})

gameService.on(Config.Event.GEN_MONSTER, (m) => {
    // console.log('GEN_MONSTER', m);
    let data = {
        monster: m
    }
    io.emit(Config.Event.GEN_MONSTER, JSON.stringify(data))
})

gameService.on(Config.Event.PROFIT_MONEY, () => {
    let moneys = gameService.getData().roles.map((r) => r.money)
    console.log('PROFIT_MONEY', moneys);
})

gameService.on(Config.Event.PROFIT_RESOURCE, () => {
    let storage = gameService.getData().storage
    let iron = storage.get(Config.Storages.IRON)
    let wood = storage.get(Config.Storages.WOOD)
    let food = storage.get(Config.Storages.FOOD)

    console.log('PROFIT_RESOURCE', iron, wood, food);
})

gameService.on(Config.Event.NEW_QUEST, (nq) => {
    console.log('NEW_QUEST', nq);
})


io.on('connection', (socket) => {
    console.log('A user connected');
    // let data = { data: gameService.getData() }
    // socket.emit('INIT', JSON.stringify(data))

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('test', function (msg: string) {
        // console.log(msg)
        // io.emit('test', msg)
    })

    socket.on('GET_DATA', () => {
        let data = gameService.getData();
        socket.emit('GET_DATA', JSON.stringify(data))
    })


});




httpServer.listen(3000, function () {
    console.log('Server listening on port 3000!');
});