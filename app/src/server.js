import path from 'path'
import express from 'express'
import * as Game from './game.js'
import GameService from './game-service.js'

let gameService = new GameService()
gameService.start();

const app = express();
let www = path.join(__dirname, '..', 'www');
app.use(express.static(www));

app.get('/move', function (req, res) {
    if (!gameService.checkActionTimer()) return res.send(`Wait ActionTime`);

    let x = Number.parseInt(req.query.x);
    let y = Number.parseInt(req.query.y);

    try {
        gameService.move(x, y);
        let txt = `Role Move ... ${JSON.stringify(gameService.role.point)}`;
        return res.send(txt);
    } catch (e) {
        return res.send(e.message);
    }
});

app.get('/search', function (req, res) {
    if (!gameService.checkActionTimer()) return res.send(`Wait ActionTime`);

    let result = gameService.search();
    if (result.veiwableMonsters.length == 0 && result.veiwableResources.length == 0) {
        return res.send(`Not Found`);
    } else {
        let txt = '';
        for (let m of result.veiwableMonsters) txt = txt + `Monster ${JSON.stringify(m.point)}</br>`;
        for (let i of result.veiwableResources) txt = txt + `Resource ${JSON.stringify(i.point)}</br>`;
        return res.send(txt);
    }
})

app.get('/atk', function (req, res) {
    if (!gameService.checkActionTimer()) return res.send(`Wait ActionTime`);

    try {
        let hereMonster = gameService.atk();
        if (hereMonster)
            return res.send(`Atk Monster Successs. Role:${gameService.role.values.nowLife} Monster:${hereMonster.values.nowLife}`);
        else
            return res.send(`Kill Monster Successs . Role:${gameService.role.values.nowLife}`);
    } catch (e) {
        return res.send(e.message);
    }
})

app.get('/collect', function (req, res) {
    if (!gameService.checkActionTimer()) return res.send(`Wait ActionTime`);

    try {
        gameService.collect();
        return res.send(`Collect Successs ${JSON.stringify(gameService.role.point)}}`);
    } catch (e) {
        return res.send(e.message);
    }
})

app.get('/self', function (req, res) {
    let obj = {
        bag: gameService.role.itemList
    }
    return res.send(JSON.stringify(obj));
})

app.get('/quest', function (req, res) {
    let temp = gameService.questList.map((quest) => ({ ...quest, expiration: quest.expiration - gameService.nowTime }))
    return res.send(JSON.stringify(temp));
})

app.get('/submit', function (req, res) {
    let id = Number(req.query.id);
    try {
        gameService.submit(id);
        return res.send(`Submit Quest Successs`);
    } catch (e) {
        return res.status(405).send(e.message);
    }
})

app.get('/buy', function (req, res) {
    let id = Number(req.query.id);
    try {
        gameService.buyItem(id);
        return res.send(`Buy Item Successs`);
    } catch (e) {
        return res.status(405).send(e.message);
    }
})

app.get('/sell', function (req, res) {
    let id = Number(req.query.id);
    try {
        gameService.sellItem(id);
        return res.send(`Sell Item Successs`);
    } catch (e) {
        return res.status(405).send(e.message);
    }
})

app.get('/shop', function (req, res) {
    try {
        let hereShop = gameService.shopMap.get(gameService.hereArea());
        return res.send(JSON.stringify(hereShop.itemList));
    } catch (e) {
        return res.status(405).send(e.message);
    }
})

app.get('/refreshShop', function (req, res) {
    try {
        gameService.refreshShopByMoney();
        return res.send(`Refresh Shop Successs`);
    } catch (e) {
        return res.status(405).send(e.message);
    }
})


app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});


// Test print game world
setInterval(() => {

    return;
    let points = [];
    for (let area of gameService.areaList)
        points = points.concat(area.getAllPoints())

    let maxX = 0;
    let maxY = 0;
    for (let p of points) {
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }

    for (let y = 0; y <= maxY; y++) {
        let txt = '';
        for (let x = 0; x <= maxX; x++) {
            let point = new Game.Point(x, y);
            if (points.find((p) => p.same(point))) {
                if (point.same(gameService.role.point))
                    txt = txt + 'Ｏ';
                else if (gameService.monsterList.find((m) => m.point.same(point)))
                    txt = txt + 'Ｘ';
                else if (gameService.resourceList.find((i) => i.point.same(point)))
                    txt = txt + '＃';

                else
                    txt = txt + '　';
            } else
                txt = txt + '　';
        }
        console.log(txt);
    }
    console.log('-------------------');
}, 200)
