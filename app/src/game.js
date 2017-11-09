// import fs from 'fs'

export class Point {

    /**
     * 
     * @param {Number} x 
     * @param {Number} y 
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * 
     * @param {Number} xDis 
     * @param {Number} yDis 
     * @returns {Point} 
     */
    move(xDis, yDis) {
        return new Point(this.x + xDis, this.y + yDis);
    }

    /**
     * 
     * @param {Point} other 
     * @returns {Number} 
     */
    lineDistance(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }

    /**
     * 
     * @param {Point} other 
     * @returns {Number} 
     */
    latticeDistance(other) {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }

    /**
     * 
     * @param {Point} other 
     * @returns {Boolean} 
     */
    same(other) {
        return this.x == other.x && this.y == other.y;
    }

}

export class Rect {

    /**
     * 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} width 
     * @param {Number} height 
     */
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        if (width < 1 || height < 1) throw new Error('Rect: Width or Height Error');
    }

    /**
     * 
     * @param {Point} point 
     * @returns {Boolean} 
     */
    isPointInRect(point) {
        return point.x >= this.x && point.y >= this.y && point.x < this.x + this.width && point.y < this.y + this.height;
    }

    /**
     * @returns {Array<Point>}
     */
    getAllPoints() {
        let points = [];
        for (let x = this.x; x < this.x + this.width; x++) {
            for (let y = this.y; y < this.y + this.height; y++) {
                points.push(new Point(x, y));
            }
        }
        return points;
    }
}

export class Area {

    /**
     * 
     * @param {Array<Rect>} includeRectList 
     * @param {Array<Rect>} excludeRectList
     */
    constructor(includeRectList, excludeRectList) {
        this.includeRectList = includeRectList;
        this.excludeRectList = excludeRectList;
        // 檢查合理性
    }

    /**
     * 
     * @param {Point} point 
     * @returns {Boolean} 
     */
    isPointInArea(point) {
        let exc = this.excludeRectList.filter((rect) => rect.isPointInRect(point))
        if (exc.length > 0) return false;
        let inc = this.includeRectList.filter((rect) => rect.isPointInRect(point))
        if (inc.length > 0) return true;
    }

    /**
     * @returns {Array<Point>}
     */
    getAllPoints() {
        /** @type {Array<Point>} */
        let points = [];

        // Add include rect
        for (let rect of this.includeRectList) {
            points = points.concat(rect.getAllPoints());
        }

        // Filte exclude rect
        points = points.filter((p) => {
            for (let exRect of this.excludeRectList) {
                if (exRect.isPointInRect(p)) return false;
            }
            return true;
        })

        // Filte repeat
        let i1 = 0;
        while (i1 < points.length) {
            let p1 = points[i1];
            points = points.filter((p2, i2) => {
                if (i1 == i2) return true;
                if (p1.same(p2)) return false;
                return true;
            })
            i1++;
        }

        return points;
    }
}

export class RangeValue {

    /**
     * 
     * @param {Number} min
     * @param {Number} max 
     * @param {Number} now 
     */
    constructor(min, max, now) {
        this.min = min;
        this.max = max;
        this.now = now;
    }
}

export class RoleValues {

    /**
     * 
     * @param {Number} maxLife 
     * @param {Number} nowLife 
     * @param {Number} atk 
     */
    constructor(maxLife, nowLife, atk) {
        this.maxLife = maxLife;
        this.nowLife = nowLife;
        this.atk = atk;

        this.actionTimer = 0;
        this.moveDelay = 1; //1000
        this.searchDelay = 1; //1500
        this.collectDelay = 1; //1500
        this.atkDelay = 1; //1500

        this.searchDistance = 2.0;
    }
}

export class Role {

    /**
     * 
     * @param {Point} point
     * @param {RoleValues} values
     */
    constructor(point, values) {
        this.point = point;
        this.values = values;
        /** @type {Array<Item>} */
        this.itemList = [];
        this.money = 0;
        this.score = 0;
    }
}

export class MonsterValues {

    /**
     * 
     * @param {Number} maxLife 
     * @param {Number} nowLife 
     * @param {Number} atk 
     */
    constructor(maxLife, nowLife, atk) {
        this.maxLife = maxLife;
        this.nowLife = nowLife;
        this.atk = atk;
    }
}

export class Monster {

    /**
     * 
     * @param {Point} point 
     * @param {Number} id
     * @param {MonsterValues} values
     */
    constructor(point, id, values) {
        this.point = point;
        this.id = id;
        this.values = values;
    }
}

export class Resource {

    /**
     * 
     * @param {Point} point 
     * @param {Number} id
     * @param {Number} stock
     */
    constructor(point, id, stock) {
        this.point = point;
        this.id = id;
        this.stock = stock;
    }
}

export class World {

    /**
     * 
     * @param {Number} width 
     * @param {Number} height 
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * 
     * @param {Point} point 
     * @returns {Boolean} 
     */
    isPointInWorld(point) {
        return point.x >= 0 && point.y >= 0 && point.x < this.width && point.y < this.height;
    }
}

export class Item {
    /**
     * 
     * @param {Number} id 
     */
    constructor(id) {
        this.id = id;
    }
}

// export class ItemQuantity {
//     /**
//      * 
//      * @param {Item} item 
//      * @param {Number} quantity 
//      */
//     constructor(item, quantity) {
//         this.item = item;
//         this.quantity = quantity;
//     }
// }

export class Quest {

    /**
     * 
     * @param {Number} expiration
     * @param {Array<Item>} requirements 
     * @param {Array<Item>} rewards 
     * @param {Number} money 
     * @param {Number} score 
     */
    constructor(expiration, requirements, rewards, money = 0, score = 0) {
        this.expiration = expiration
        this.requirements = requirements;
        this.rewards = rewards;
        this.money = money;
        this.score = score;
    }
}


export class GameConfig {
    static WORLD_WIDTH = 57;
    static WORLD_HEIGHT = 32;
}