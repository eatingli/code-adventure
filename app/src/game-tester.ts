import * as Config from './game-config'
import { Point, Rect, Area, } from './game.js'
import GameService from './game-service.js'


let delay = (time: number) => { return new Promise((resolve) => setTimeout(resolve, time)) }

export default class GameTester {

    gameService: GameService;

    constructor(gameService: GameService) {
        this.gameService = gameService;
    }

    private async moveTo(role: any, p: Point) {
        var dis = p.x - role.p.x;
        for (let i = 0; i < Math.abs(dis); i++) {
            if (dis < 0) this.gameService.roleMove(role.id, -1, 0);
            else this.gameService.roleMove(role.id, 1, 0);
            await delay(250);

        }
        var dis = p.y - role.p.y;
        for (let i = 0; i < Math.abs(dis); i++) {
            if (dis < 0) this.gameService.roleMove(role.id, 0, -1);
            else this.gameService.roleMove(role.id, 0, 1);
            await delay(250);
        }
    }

    private async goSleep(role: any) {
        let building = this.gameService.getData().buildings.find((b) => b.c == Config.Buildings.B1)
        await this.moveTo(role, building.p)
        this.gameService.roleSleep(role.id)
        await delay(250);
    }

    private async  goCollect(role: any) {
        let res = this.gameService.getData().resources[0];
        for (let r of this.gameService.getData().resources) {
            if (r.p.latticeDistance(role.p) < res.p.latticeDistance(role.p)) res = r;
        }
        await this.moveTo(role, res.p)
        this.gameService.roleCollect(role.id);
        await delay(2000);
    }

    private async  goAtk(role: any) {

        let monster = this.gameService.getData().monsters[0];
        for (let m of this.gameService.getData().monsters) {
            if (m.p.latticeDistance(role.p) < monster.p.latticeDistance(role.p)) monster = m;
        }
        await this.moveTo(role, monster.p)
        this.gameService.roleAtk(role.id);
        await delay(330);
    }

    private async  goUpgrade(role: any) {
        for (let i = 0; i < role.equip.length; i++) {
            let level = role.equip[i];
            let cost = Config.Role.UPGRADE_COST(i, level);
            if (role.money > cost && level < 5) {
                let building = this.gameService.getData().buildings.find((b) => b.c == Config.Buildings.B3)
                await this.moveTo(role, building.p)
                this.gameService.roleUpgrade(role.id, i);
                await delay(300);
                break;
            }
        }
    }

    private async  goCarry(role: any) {
        let { iron, wood, food } = this.gameService.getData().storage;
        if (iron > 0 && wood > 0 && food > 0) {
            let building = this.gameService.getData().buildings.find((b) => b.c == Config.Buildings.B2)
            await this.moveTo(role, building.p)
            this.gameService.roleCarry(role.id);
            await delay(300);
        }
    }

    private async  goBuild(role: any) {
        if (role.bag) {
            let target = [Config.Buildings.B1, Config.Buildings.B2, Config.Buildings.B3, Config.Buildings.B4, Config.Buildings.B5][Math.floor(Math.random() * 5)];
            let building = this.gameService.getData().buildings.find((b) => b.c == target)
            await this.moveTo(role, building.p)
            this.gameService.roleBuild(role.id);
            await delay(300);
        }
    }

    private async  goTrade(role: any) {
        let stor = [Config.Storages.FOOD, Config.Storages.IRON, Config.Storages.WOOD][Math.floor(Math.random() * 3)];
        let price = Config.Resource.BUY_PRICE(stor);
        if (role.money >= price) {
            let building = this.gameService.getData().buildings.find((b) => b.c == Config.Buildings.B4)
            await this.moveTo(role, building.p)
            this.gameService.roleTrade(role.id, stor);
            await delay(300);
        }
    }

    private async roleAuto(roldId: number) {
        for (let iii = 0; iii < 999999; iii++) {
            while (this.gameService.getData().monsters.length == 0) await delay(1);
            while (this.gameService.getData().resources.length == 0) await delay(1);
            let role = this.gameService.getData().roles[roldId];

            let random = Math.random();
            if (random < 0.05) {
                this.gameService.roleHello(roldId)
                await delay(50);
            } else if (random < 0.45) {
                if (role.life > 0)
                    await this.goAtk(role);
                else
                    await this.goSleep(role);
            } else if (random < 0.55) {
                if (role.energy > 0)
                    await this.goCollect(role);
                else
                    await this.goSleep(role);
            } else if (random < 0.65) {
                await this.goUpgrade(role);
            } else if (random < 0.8) {
                await this.goTrade(role);
            } else if (random < 0.9) {
                await this.goCarry(role);
            } else if (random < 1.0) {
                await this.goBuild(role);
            }
            await delay(1);
        }
    }

    public async start() {
        await delay(3000);
        for (let role of this.gameService.getData().roles) {
            this.roleAuto(role.id);
        }
    }
}