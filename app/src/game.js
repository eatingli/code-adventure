// import fs from 'fs'

export class Point {

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * 
     * @param {Number} xDis 
     * @param {Number} yDis 
     */
    move(xDis, yDis) {
        return new Point(this.x + xDis, this.y + yDis);
    }

    /**
     * 
     * @param {Point} other 
     */
    lineDistance(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }

    /**
     * 
     * @param {Point} other 
     */
    latticeDistance(other) {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y, );
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

export class PlayerValues {

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
        this.moveDelay = 1000;
        this.searchDelay = 1500;
        this.collectDelay = 1500;
        this.atkDelay = 1500;

        this.watchDistance = 2.0;
    }
}

export class Player {

    /**
     * 
     * @param {Point} point
     * @param {PlayerValues} values
     */
    constructor(point, values) {
        this.point = point;
        this.values = values;
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

export class Item {

    /**
     * 
     * @param {Point} point 
     * @param {Number} id
     */
    constructor(point, id) {
        this.point = point;
        this.id = id;
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
     */
    isPointInWorld(point) {
        return point.x >= 0 && point.y >= 0 && point.x < this.width && point.y < this.height;
    }
}


export class GameConfig {
    static WORLD_WIDTH = 57;
    static WORLD_HEIGHT = 32;
}