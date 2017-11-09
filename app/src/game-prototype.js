
/**
 * 遊戲所需的基本參數架構
 */

export class ItemRate {

    /**
     * 
     * @param {Number} itemId 
     * @param {Number} rate 0~1 => 0~100% 
     */
    constructor(itemId, rate) {
        this.itemId = itemId;
        this.rate = rate;
    }
}

export class MonsterPrototype {

    /**
     * 
     * @param {Number} id 
     * @param {Array<ItemRate>} rewards 
     * @param {Number} money 
     * @param {Number} score 
     */
    constructor(id, rewards, money, score) {
        this.id = id;
        this.rewards = rewards;
        this.money = money;
        this.score = score;
    }
}