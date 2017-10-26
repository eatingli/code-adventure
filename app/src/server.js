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
// let world = new World(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);
let world = new World(10, 10);
let player = new Player(new Point(5, 5), new PlayerValues(200, 100, 35));
let monster = new Monster(new Point(5, 6), 0, new MonsterValues(200, 200, 15));
let item = new Item(new Point(5, 7), 0);


// Const
const MONSTER_BORN_PERIOD = 5000;
const MONSTER_AMOUNT_MAX = 20;
const ITEM_APPEAR_PERIOD = 3000;
const ITEM_AMOUNT_MAX = 30;

// Game Attributes
let monsterList = [];
let itemList = [];
let monsterTimer = Date.now();
let itemTimer = Date.now();


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

function availablePoint() {
    let width = world.width;
    let height = world.height;
    let usedPoints = [];
    usedPoints = usedPoints.concat(monsterList.map((m) => m.point));
    usedPoints = usedPoints.concat(itemList.map((i) => i.point));

    let availablePoints = [];
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let newPoint = new Point(x, y);
            let flag = true;
            for (let p of usedPoints) {
                if (p.same(newPoint)) {
                    flag = false;
                    break;
                }
            }
            if (flag) availablePoints.push(newPoint)
        }
    }
    // console.log(`availablePoints: ${availablePoints.length}`);
    if (availablePoints.length > 0) {
        let index = Math.floor(Math.random() * availablePoints.length)
        return availablePoints[index];
    } else {
        return null;
    }
}


// Game loop
setInterval(() => {
    nowTime = Date.now();

    // Check Amount
    if (monsterList.length >= MONSTER_AMOUNT_MAX) monsterTimer = nowTime + MONSTER_BORN_PERIOD;
    if (itemList.length >= ITEM_AMOUNT_MAX) itemTimer = nowTime + ITEM_APPEAR_PERIOD;

    // New Monster
    if (nowTime > monsterTimer) {
        let p = availablePoint();

        if (p) {
            monsterTimer = nowTime + MONSTER_BORN_PERIOD;
            let newMonster = new Monster(p, 0, new MonsterValues(200, 200, 15));
            monsterList.push(newMonster);
            console.log('New Monster');
        } else {
            console.log('No Available Point');
        }
    }

    // New Item
    if (nowTime > itemTimer) {
        let p = availablePoint();
        if (p) {
            itemTimer = nowTime + ITEM_APPEAR_PERIOD;
            let newItem = new Item(p, 0);
            itemList.push(newItem);
            console.log('New Item');
        } else {
            console.log('No Available Point');
        }
    }

}, 10)

setInterval(() => {
    console.log(`m:${monsterList.length} i:${itemList.length}`)
}, 1000)

// (async() => {
// })()