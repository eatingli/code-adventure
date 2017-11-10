import {
    Point,
    Rect,
    Area,
    RoleValues,
    Role,
    MonsterValues,
    Monster,
    World,
    GameConfig,
    Resource,
    Item,
    Quest,
    Shop,
} from './game.js'


// Const
const MONSTER_BORN_PERIOD = 1000;
const MONSTER_AMOUNT_MAX = 6;
const RESOURCE_APPEAR_PERIOD = 1000;
const RESOURCE_AMOUNT_MAX = 6;
const SHOP_REFRESH_PERIOD = 10000;
const SHOP_ITEM_MAX = 5;
const SHOP_REFRESH_PRICE = 1500;

const QUEST_MAX = 10;
const BAG_SIZE_MAX = 50;
const AREA_AMOUNT = 4;

export default class GameService {

    constructor() {
        let nowTime = this.nowTime = Date.now();
        // let world = new World(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);
        let world = this.world = new World(10, 10);
        this.role = new Role(new Point(5, 5), new RoleValues(999999, 999999, 99));
        /** @type {Array<Monster>} */
        this.monsterList = [];
        /** @type {Array<Resource>} */
        this.resourceList = [];

        let area1 = new Area([new Rect(0, 0, 5, 5)], []);
        let area2 = new Area([new Rect(5, 0, 5, 5)], []);
        let area3 = new Area([new Rect(0, 5, 5, 5)], []);
        let area4 = new Area([new Rect(5, 5, 5, 5)], []);
        /** @type {Array<Area>} */
        let areaList = this.areaList = [area1, area2, area3, area4];
        /** @type {Array<Quest>} */
        let questList = this.questList = [];
        /** @type {Array<Shop>} */
        let shopList = this.shopList = [];
        for (let i = 0; i < AREA_AMOUNT; i++) shopList.push(new Shop([]));
        /** @type {Map<Area, Shop>} */
        let shopMap = this.shopMap = new Map();
        for (let i = 0; i < AREA_AMOUNT; i++) shopMap.set(areaList[i], shopList[i]);

        this.itemIdCounter = 0;
        this.questIdConuter = 0;

        this.monsterTimer = Date.now();
        this.resourceTimer = Date.now();
        this.shopRefreshTimer = Date.now(); //+ SHOP_REFRESH_PERIOD;

        // 檢查 Area 數量
        if (this.areaList.length != AREA_AMOUNT) throw new Error('Area Amount Error');
        // 檢查 Area 不重疊
        if (areaList.length > 1) {
            for (let i = 0; i < areaList.length; i++) {
                for (let j = i + 1; j < areaList.length; j++) {
                    for (let p1 of areaList[i].getAllPoints()) {
                        for (let p2 of areaList[j].getAllPoints()) {
                            if (p1.same(p2)) throw new Error('Area Cover Error');
                        }
                    }
                }
            }
        }
        // 檢查 Area 涵蓋整張地圖
        let total = 0;
        for (let area of areaList) total += area.getAllPoints().length;
        if (total != world.height * world.height) throw new Error('Area Cover Error');

        // test
        this.role.money = 50000;
        for (let i = 0; i < 30; i++)
            this.role.itemList.push(this.newItem(i % 5));

        // 隨機任務
        for (let i = 0; i < QUEST_MAX; i++) {
            this.newRandomQuest();
        }

    }

    checkActionTimer() {
        return this.nowTime >= this.role.values.actionTimer;
    }

    move(x, y) {
        let dis = Math.abs(x) + Math.abs(y);
        if (dis > 1) throw new Error('Move too far');
        if (dis <= 0) throw new Error('Move too short');

        let role = this.role;
        let temp = role.point.move(x, y);
        if (this.world.isPointInWorld(temp)) role.point = temp;
        role.values.actionTimer = this.nowTime + role.values.moveDelay;
    }

    search() {
        let role = this.role;
        role.values.actionTimer = this.nowTime + role.values.searchDelay;

        // Search Monster, Resource
        let veiwableMonsters = this.monsterList.filter((m) => role.point.lineDistance(m.point) < role.values.searchDistance);
        let veiwableResources = this.resourceList.filter((resource) => role.point.lineDistance(resource.point) < role.values.searchDistance);

        return {
            veiwableMonsters: veiwableMonsters,
            veiwableResources: veiwableResources
        }
    }

    atk() {
        let role = this.role;
        let monsterList = this.monsterList;
        let hereMonster = monsterList.find((m) => role.point.same(m.point));

        if (hereMonster) {
            if (hereMonster.values.nowLife <= 0) throw new Error(`Monster Already Died`); // 不可能被執行到

            let roleNewLife = role.values.nowLife - hereMonster.values.atk;
            let monsterNewLife = hereMonster.values.nowLife - role.values.atk;
            if (roleNewLife <= 0) throw new Error(`Role Life Not Enough`);

            role.values.actionTimer = this.nowTime + role.values.collectDelay;
            role.values.nowLife = roleNewLife;

            // Kill
            if (monsterNewLife <= 0) {
                monsterList.splice(monsterList.indexOf(hereMonster), 1);
                this.monsterReward(hereMonster.type);
                return null;
            } else {
                hereMonster.values.nowLife = monsterNewLife;
                return hereMonster;
            }

        } else {
            throw new Error(`No Monster Here ${JSON.stringify(role.point)}}`);
        }
    }

    collect() {
        let role = this.role;
        let resourceList = this.resourceList;
        let hereResource = resourceList.find((resource) => role.point.same(resource.point));
        if (!hereResource) throw new Error(`No Resource Here ${JSON.stringify(role.point)}}`);
        if (hereResource.stock < 1) throw new Error(`No Enough Resource`);

        role.values.actionTimer = this.nowTime + role.values.collectDelay;
        hereResource.stock -= 1;
        if (hereResource.stock == 0)
            resourceList.splice(resourceList.indexOf(hereResource), 1);

        this.resourceReward(hereResource.type);
    }

    submit(questId) {
        let questList = this.questList;
        let role = this.role;
        let quest = questList.find((quest) => quest.id == questId);
        if (!quest) throw new Error('Quest not found');
        if (this.nowTime > quest.expiration) throw new Error('Quest expired');
        if (role.itemList.length - quest.requirements.length + quest.rewards.length > BAG_SIZE_MAX) throw new Error('Bag out of size');

        // Check role has enough items
        let temp = [];
        let check = true;
        outer:
        for (let need of quest.requirements) {
            for (let has of role.itemList) {
                if (temp.find((item) => item == has)) continue;
                if (has.type == need.type) {
                    temp.push(has);
                    continue outer;
                }
            }
            check = false;
            break outer;
        }
        if (!check) throw new Error(`Don't reach quest requirements`);

        // Remove requirements from bag
        for (let item of temp)
            role.itemList.splice(role.itemList.indexOf(item), 1);
        // Add reward into bag
        for (let item of quest.rewards)
            role.itemList.push(item)

        // Money and score
        role.score += quest.score;
        role.money += quest.money;

        // Update Quest
        questList.splice(questList.findIndex((quest) => quest.id == questId), 1)
        this.newRandomQuest();
    }

    sellItem(id) {
        let item = this.role.itemList.find((i) => i.id == id);
        if (!item) throw new Error('Item not found');
        this.role.money += this.itemRecyclePrice(item.type);
        this.role.itemList.splice(this.role.itemList.findIndex((i) => i.id == id), 1);
    }

    buyItem(id) {

        if (this.role.itemList.length >= BAG_SIZE_MAX) throw new Error('Bag is full');
        let hereArea = this.hereArea();
        let hereShop = this.shopMap.get(hereArea);

        let item = hereShop.itemList.find((i) => i.id == id);
        if (!item) throw new Error('Item not found');

        // 扣錢
        let price = this.itemPrice(item.type);
        if (this.role.money < price) throw new Error('Money not enough');
        this.role.money -= price;

        // 領道具
        this.role.itemList.push(item);

        // 從商店中移除
        hereShop.itemList.splice(hereShop.itemList.findIndex((i) => i.id = id), 1);
    }

    hereArea() {
        let point = this.role.point;
        for (let area of this.areaList)
            if (area.getAllPoints().findIndex((p) => p.same(point)) > -1) return area;
    }

    refreshShop(shop) {
        shop.itemList.splice(0, shop.itemList.length);
        for (let i = 0; i < SHOP_ITEM_MAX; i++) {
            let randomType = Math.floor(Math.random() * 5);
            shop.itemList.push(this.newItem(randomType));
        }
    }

    refreshShopByMoney() {
        if (this.role.money < SHOP_REFRESH_PRICE) throw new Error('Money not enough');
        this.role.money -= SHOP_REFRESH_PRICE;

        let hereShop = this.shopMap.get(this.hereArea());
        this.refreshShop(hereShop);
    }

    /**
     * Get point without monster and item in the world
     */
    availablePoint() {
        let width = this.world.width;
        let height = this.world.height;

        // Used points: point with monster or item 
        let usedPoints = [];
        usedPoints = usedPoints.concat(this.monsterList.map((m) => m.point));
        usedPoints = usedPoints.concat(this.resourceList.map((i) => i.point));

        // Available points: 
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

        // Random point
        if (availablePoints.length > 0) {
            let index = Math.floor(Math.random() * availablePoints.length)
            return availablePoints[index];
        } else {
            return null;
        }
    }

    usedPoints() {
        let usedPoints = [];
        usedPoints = usedPoints.concat(this.monsterList.map((m) => m.point));
        usedPoints = usedPoints.concat(this.resourceList.map((i) => i.point));
        return usedPoints;
    }

    /**
     * Remove points from other points
     * @param {Array<Point>} points 
     * @param {Array<Point>} removePoints 
     */
    static filterPoints(points, removePoints) {
        return points.filter((p1) => {
            for (let p2 of removePoints) {
                if (p1.same(p2)) return false;
            }
            return true;
        })
    }

    /**
     * Get random point 
     * @param {*} points 
     */
    static randomPoint(points) {
        if (points.length > 0) {
            let index = Math.floor(Math.random() * points.length)
            return points[index];
        } else {
            return null;
        }
    }

    newRandomQuest() {
        let randomTime = 10000 + Math.floor(Math.random() * 5000);
        let randomReq = Math.floor(Math.random() * 6);
        let randomRew = Math.floor(Math.random() * 6);
        let requirements = [this.newItem(randomReq), this.newItem(randomReq)];
        let rewards = [this.newItem(randomRew), this.newItem(randomRew)];
        let newQ = new Quest(this.questIdConuter++, this.nowTime + randomTime, requirements, rewards, 5, 5);
        this.questList.push(newQ)
    }

    newRandomMonster() {

        // 各區域獨立產生
        for (let area of this.areaList) {

            // 檢查區域數量上限
            let amount = this.monsterList.filter((monster) => area.isPointInArea(monster.point)).length;
            if (amount >= MONSTER_AMOUNT_MAX) continue;

            // Available Point: 只要沒有怪物都行
            let availablePoints = GameService.filterPoints(area.getAllPoints(), this.monsterList.map((monster) => monster.point));
            if (availablePoints.length < 1) continue;
            let p = GameService.randomPoint(availablePoints);

            // 如果該位置有資源，則刪除掉
            let r = this.resourceList.findIndex((r) => r.point.same(p));
            if (r > -1) this.resourceList.splice(r, 1);

            // 產生該區域特色怪物
            let randomType = Math.floor(Math.random() * 5);
            let newMonster = new Monster(p, randomType, new MonsterValues(200, 200, 15));
            this.monsterList.push(newMonster);
        }
    }

    newRandomResource() {

        // 各區域獨立產生
        for (let area of this.areaList) {
            // 檢查區域數量上限
            let amount = this.resourceList.filter((r) => area.isPointInArea(r.point)).length;
            if (amount >= RESOURCE_AMOUNT_MAX) continue;

            // Available Point: 沒有怪物、沒有資源、不在佔領區
            let availablePoints = area.getAllPoints()
            availablePoints = GameService.filterPoints(availablePoints, this.monsterList.map((monster) => monster.point));
            availablePoints = GameService.filterPoints(availablePoints, this.resourceList.map((monster) => monster.point));
            if (availablePoints.length < 1) continue;
            let p = GameService.randomPoint(availablePoints);

            // 產生資源
            let randomType = Math.floor(Math.random() * 5);
            let newResource = new Resource(p, randomType, 3);
            this.resourceList.push(newResource);

        }
    }

    newItem(type) {
        return new Item(this.itemIdCounter++, type)
    }

    monsterReward(type) {
        let items = [];
        let money = 0;
        let score = 0;
        switch (type) {
            case 0:
                if (Math.random() < 0.6) items.push(this.newItem(0))
                if (Math.random() < 0.1) items.push(this.newItem(0))
                if (Math.random() < 0.01) items.push(this.newItem(1))
                money = 5;
                score = 1;
                break;
            case 1:
                if (Math.random() < 0.6) items.push(this.newItem(1))
                if (Math.random() < 0.1) items.push(this.newItem(1))
                if (Math.random() < 0.01) items.push(this.newItem(2))
                money = 8;
                score = 1;
                break;
            case 2:
                if (Math.random() < 0.6) items.push(this.newItem(2))
                if (Math.random() < 0.1) items.push(this.newItem(2))
                if (Math.random() < 0.01) items.push(this.newItem(3))
                money = 12;
                score = 1;
                break;
            case 3:
                if (Math.random() < 0.6) items.push(this.newItem(3))
                if (Math.random() < 0.1) items.push(this.newItem(3))
                if (Math.random() < 0.01) items.push(this.newItem(4))
                money = 15;
                score = 1;
                break;
            case 4:
                if (Math.random() < 0.6) items.push(this.newItem(4))
                if (Math.random() < 0.2) items.push(this.newItem(4))
                if (Math.random() < 0.1) items.push(this.newItem(4))
                money = 30;
                score = 10;
                break;
        }
        for (let item of items)
            if (this.role.itemList.length < BAG_SIZE_MAX) this.role.itemList.push(item);
        this.role.score += score;
        this.role.money += money;
    }

    resourceReward(type) {
        let itemType = null;
        switch (type) {
            case 0: itemType = 0; break;
            case 1: itemType = 1; break;
            case 2: itemType = 2; break;
            case 3: itemType = 3; break;
            case 4: itemType = 4; break;
        }
        if (this.role.itemList.length < BAG_SIZE_MAX)
            this.role.itemList.push(this.newItem(itemType));
    }

    itemPrice(type) {
        switch (type) {
            case 0: return 20;
            case 1: return 20;
            case 2: return 20;
            case 3: return 20;
            case 4: return 1000;
        }
    }

    itemRecyclePrice(type) {
        switch (type) {
            case 0: return 5;
            case 1: return 5;
            case 2: return 5;
            case 3: return 5;
            case 4: return 1000;
        }
    }

    loop() {
        let nowTime = this.nowTime = Date.now();
        let monsterList = this.monsterList;
        let resourceList = this.resourceList;
        let areaList = this.areaList;
        let questList = this.questList;

        // Check Amount
        if (monsterList.length >= MONSTER_AMOUNT_MAX * 2) this.monsterTimer = nowTime + MONSTER_BORN_PERIOD;
        if (resourceList.length >= RESOURCE_AMOUNT_MAX * 2) this.resourceTimer = nowTime + RESOURCE_APPEAR_PERIOD;

        // 區域必須有獨立 timer 和 counter

        // New Monster
        if (nowTime > this.monsterTimer) {
            this.newRandomMonster();
            this.monsterTimer = nowTime + MONSTER_BORN_PERIOD;
        }

        // New Resource
        if (nowTime > this.resourceTimer) {
            this.newRandomResource();
            this.resourceTimer = nowTime + RESOURCE_APPEAR_PERIOD;
        }

        // Update expire quest
        let expire = this.questList.filter((quest) => quest.expiration < this.nowTime);
        for (let quest of expire) {
            this.questList.splice(this.questList.indexOf(quest), 1);
        }
        for (let i = 0; i < expire.length; i++)
            this.newRandomQuest();

        // Shop refresh
        if (this.shopRefreshTimer < this.nowTime) {
            for (let shop of this.shopList) {
                this.refreshShop(shop);
            }
            this.shopRefreshTimer = this.nowTime + SHOP_REFRESH_PERIOD;
        }
    }

    start() {
        setInterval(this.loop.bind(this), 10);
    }
}