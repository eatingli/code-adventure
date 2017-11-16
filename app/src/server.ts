require('source-map-support').install()
import * as path from 'path'
import * as express from 'express'
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

app.get('/map', function (req, res) {
    try {
        let obj = {
            areaList: gameService.areaList,
            role: gameService.role,
            resourceList: gameService.resourceList,
            monsterList: gameService.monsterList
        };
        return res.send(JSON.stringify(obj));
    } catch (e) {
        return res.status(405).send(e.message);
    }
})


app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

// Test print game world
setInterval(() => {

    let temp = gameService.resourceList.filter((r) => r.type > 600 && r.type < 700);
    if (temp.length > 0) console.log(temp)
}, 100)
