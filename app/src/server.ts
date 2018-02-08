require('source-map-support').install()
import * as path from 'path'
import * as http from 'http'
import * as express from 'express'
import * as socketio from 'socket.io'
import * as Game from './game.js'
import * as Config from './game-config'
import GameService from './game-service.js'
import GameTester from './game-tester.js';

const app = express();
const httpServer = new http.Server(app);
const io = socketio(httpServer);

let www = path.join(__dirname, '..', 'www');
app.use(express.static(www));

let gameService = new GameService()
gameService.start();

/**
 * ---------------------------------- System Event ---------------------------------- 
 */
gameService.on(Config.Event.GEN_RESOURCE, (resource) => {
    // console.log(Config.Event.GEN_RESOURCE);
    let data = { resource: resource, data: gameService.getData() }
    io.emit(Config.Event.GEN_RESOURCE, JSON.stringify(data))
})

gameService.on(Config.Event.GEN_MONSTER, (monster) => {
    // console.log(Config.Event.GEN_MONSTER);
    let data = { monster: monster, data: gameService.getData() }
    io.emit(Config.Event.GEN_MONSTER, JSON.stringify(data))
})

gameService.on(Config.Event.PROFIT_MONEY, () => {
    // console.log(Config.Event.PROFIT_MONEY);
    let data = { data: gameService.getData() }
    io.emit(Config.Event.PROFIT_MONEY, JSON.stringify(data));
})

gameService.on(Config.Event.PROFIT_RESOURCE, () => {
    // console.log(Config.Event.PROFIT_RESOURCE);
    let data = { data: gameService.getData() }
    io.emit(Config.Event.PROFIT_RESOURCE, JSON.stringify(data));
})

gameService.on(Config.Event.NEW_QUEST, (quest) => {
    // console.log(Config.Event.NEW_QUEST);
    let data = { data: gameService.getData() }
    io.emit(Config.Event.NEW_QUEST, JSON.stringify(data));
})

/**
 * ---------------------------------- Player Event ---------------------------------- 
 */
gameService.on(Config.Event.ROLE_MOVE, (role) => {
    // console.log(Config.Event.ROLE_MOVE);
    let data = { role: role, data: gameService.getData() }
    io.emit(Config.Event.ROLE_MOVE, JSON.stringify(data));
})

gameService.on(Config.Event.ROLE_ATK, (role, monster) => {
    // console.log(Config.Event.ROLE_ATK);
    let data = { role: role, data: gameService.getData() }
    io.emit(Config.Event.ROLE_ATK, JSON.stringify(data));
})

gameService.on(Config.Event.ROLE_COLLECT, (role, resource) => {
    // console.log(Config.Event.ROLE_COLLECT);
    let data = { role: role, data: gameService.getData() }
    io.emit(Config.Event.ROLE_COLLECT, JSON.stringify(data));
})

gameService.on(Config.Event.ROLE_BUILD, (role, building) => {
    // console.log(Config.Event.ROLE_BUILD);
    let data = { role: role, data: gameService.getData() }
    io.emit(Config.Event.ROLE_BUILD, JSON.stringify(data));
})

gameService.on(Config.Event.ROLE_SLEEP, (role) => {
    // console.log(Config.Event.ROLE_SLEEP);
    let data = { role: role, data: gameService.getData() }
    io.emit(Config.Event.ROLE_SLEEP, JSON.stringify(data));
})

gameService.on(Config.Event.ROLE_UPGRADE, (role) => {
    // console.log(Config.Event.ROLE_UPGRADE);
    let data = { role: role, data: gameService.getData() }
    io.emit(Config.Event.ROLE_UPGRADE, JSON.stringify(data));
})

gameService.on(Config.Event.ROLE_CARRY, (role) => {
    // console.log(Config.Event.ROLE_CARRY);
    let data = { role: role, data: gameService.getData() }
    io.emit(Config.Event.ROLE_CARRY, JSON.stringify(data));
})

gameService.on(Config.Event.ROLE_TRADE, (role) => {
    // console.log(Config.Event.ROLE_TRADE);
    let data = { role: role, data: gameService.getData() }
    io.emit(Config.Event.ROLE_TRADE, JSON.stringify(data));
})

gameService.on(Config.Event.ROLE_HELLO, (role) => {
    // console.log(Config.Event.ROLE_HELLO);
    let data = { role: role }
    io.emit(Config.Event.ROLE_HELLO, JSON.stringify(data));
})

gameService.on(Config.Event.ROLE_FORBID, (role) => {
    // console.log(Config.Event.ROLE_FORBID);
    let data = { role: role }
    io.emit(Config.Event.ROLE_FORBID, JSON.stringify(data));
})

gameService.on(Config.Event.R2_GROW, () => {
    let data = { data: gameService.getData() }
    io.emit(Config.Event.R2_GROW, JSON.stringify(data));
})

gameService.on(Config.Event.MONSTER_CURE, () => {
    let data = { data: gameService.getData() }
    io.emit(Config.Event.MONSTER_CURE, JSON.stringify(data));
})

/**
 * -------------------------------------- Server -------------------------------------- 
 */
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    let data = { data: gameService.getData() };
    socket.emit('GET_DATA', JSON.stringify(data))

});

httpServer.listen(3000, function () {
    console.log('Server listening on port 3000!');
});


/**
 * -------------------------------------- Test -------------------------------------- 
 */
(async () => {
    let tester = new GameTester(gameService);
    tester.start();
})();