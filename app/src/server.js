import express from 'express'
// import * as Game from './game.js'
import {
    Point,
    PlayerValues,
    Player,
    MonsterValues,
    Monster,
    World,
    GameConfig,
    Item,
} from './game.js'


const app = express();

let nowTime = Date.now();
let world = new World(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);
let player = new Player(new Point(5, 5), new PlayerValues(200, 100, 35));
let monster = new Monster(new Point(5, 6), 0, new MonsterValues(200, 200, 15));
let item = new Item(new Point(5, 7), 0);

let monsterList = [];
let itemList = [];


app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/move', function (req, res) {
    let x = Number.parseInt(req.query.x);
    let y = Number.parseInt(req.query.y);

    if (nowTime < player.values.actionTimer) return res.send(`Wait ActionTime`);
    let temp = player.point.move(x, y);
    if (world.isPointInWorld(temp)) player.point = temp;
    player.values.actionTimer = nowTime + player.values.moveDelay;

    let txt = `Player Move ... ${JSON.stringify(player.point)}`
    console.log(txt);
    res.send(txt);
});

app.get('/atk', function (req, res) {
    if (nowTime < player.values.actionTimer) return res.send(`Wait ActionTime`);
    if (player.point.latticeDistance(monster.point) != 0) return res.send(`Distance Too Far`);
    if (monster.values.nowLife <= 0) return res.send(`Monster Already Died`);

    let playerNewLife = player.values.nowLife - monster.values.atk;
    let monsterNewLife = monster.values.nowLife - player.values.atk;

    if (playerNewLife <= 0) return res.send(`Player Life Not Enough`);
    player.values.nowLife = playerNewLife;
    player.values.actionTimer = nowTime + player.values.atkDelay;

    if (monsterNewLife <= 0) monsterNewLife = 0;
    monster.values.nowLife = monsterNewLife;

    let txt = `Player Atk... Player:${player.values.nowLife} Monster:${monster.values.nowLife}`
    console.log(txt);
    res.send(txt);
})

app.get('/search', function (req, res) {
    if (nowTime < player.values.actionTimer) return res.send(`Wait ActionTime`);
    player.values.actionTimer = nowTime + player.values.searchDelay;
    let distance = player.point.lineDistance(item.point);
    if (distance < player.values.watchDistance) return res.send(`Item Point(${JSON.stringify(item.point)})`);
    else return res.send(`Not Found`);
})

app.get('/collect', function (req, res) {
    if (nowTime < player.values.actionTimer) return res.send(`Wait ActionTime`);
    if (player.point.latticeDistance(item.point) != 0) return res.send(`Distance Too Far`);
    player.values.actionTimer = nowTime + player.values.collectDelay;
    return res.send(`Collect Successs`);
})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

// Game loop
(async() => {

    setInterval(() => {
        nowTime = Date.now();


    }, 10)

})()