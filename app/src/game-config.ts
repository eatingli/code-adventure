
import { Point, Rect, Area } from './game'

export enum Resources {
    R1 = 'R1',
    R2_0 = 'R2_0',
    R2_1 = 'R2_1',
    R2_2 = 'R2_2',
    R3 = 'R3',
    R4 = 'R4',
    R5 = 'R5',
}

export enum Monsters {
    M1 = 'M1',
    M2 = 'M2',
    M3 = 'M3',
    M4 = 'M4',
    M5 = 'M5',
    M6 = 'M6',
    M7 = 'M7',
    M8 = 'M8',
    M9 = 'M9',
}

export class Game {
    static WORLD_WIDTH = 26;
    static WORLD_HEIGHT = 18;
    static NEW_QUEST_PERIOD = 90 * 1000;
    static PROFIT_MOMEY_PERIOD = 30 * 1000;
    static PROFIT_RESOURCE_PERIOD = 30 * 1000;

    static QUEST_MONSTERS: Array<Monsters> = [
        Monsters.M1, Monsters.M2, Monsters.M3, Monsters.M4, Monsters.M5, Monsters.M6
    ];
    static QUEST_RESOURCES: Array<Resources> = [
        Resources.R1, Resources.R2_2, Resources.R3, Resources.R4, Resources.R5
    ];
}

export enum Event {
    GEN_MONSTER = 'GEN_MONSTER',
    GEN_RESOURCE = 'GEN_RESOURCE',
    NEW_QUEST = 'NEW_QUEST',
    PROFIT_MONEY = 'PROFIT_MONEY',
    PROFIT_RESOURCE = 'PROFIT_RESOURCE',
}

/**
 * Role
 */

export class Role {

    static MAX_LEVEL = 30;

    static MAX_EXP(level: number) {
        return Math.round(0.012 * level ^ 3 + 0.11 * level ^ 2 + 0.01 * level + 3)
    }

    static MAX_LIFE(level: number) {
        return Math.round(0.015 * level ^ 2 + 0.9 * level + 3) + Math.floor(level / 10) * 2
    }

    static MAX_ENERGY(level: number) {
        return Math.floor(level / 4) * 1 + Math.floor(level / 30) * 1 + 2
    }
}

/**
 * Resource
 */

// class ResourceConfig {
//     area: Area;
//     genPeriod: number;
//     genMax: number;
//     genQty: number;
// }

export class Resource {

    static GEN_AREA(c: Resources): Area {
        switch (c) {
            case Resources.R1: return new Area([new Rect(20, 0, 6, 5)], [new Rect(21, 1, 3, 3)])
            case Resources.R2_0:
            case Resources.R2_1:
            case Resources.R2_2: return new Area([new Rect(21, 11, 5, 6)], [])
            case Resources.R3: return new Area([new Rect(1, 0, 6, 5)], [])
            case Resources.R4: return new Area([new Rect(10, 11, 5, 7)], [])
            case Resources.R5: return new Area([new Rect(14, 6, 5, 5)], [])
            default: throw new Error('Class Error: ' + c);
        }
    }

    static GEN_PERIOD(c: Resources): number {
        switch (c) {
            case Resources.R1: return 12 * 1000
            case Resources.R2_0:
            case Resources.R2_1:
            case Resources.R2_2: return 10 * 1000
            case Resources.R3: return 90 * 1000
            case Resources.R4: return 90 * 1000
            case Resources.R5: return 10 * 1000
            default: throw new Error('Class Error: ' + c);
        }
    }

    static GEN_MAX(c: Resources): number {
        switch (c) {
            case Resources.R1: return 10
            case Resources.R2_0:
            case Resources.R2_1:
            case Resources.R2_2: return 20
            case Resources.R3: return 13
            case Resources.R4: return 12
            case Resources.R5: return 12
            default: throw new Error('Class Error: ' + c);
        }
    }

    static GEN_QTY(c: Resources): number {
        switch (c) {
            case Resources.R1: return 1;
            case Resources.R2_0:
            case Resources.R2_1:
            case Resources.R2_2: return 1
            case Resources.R3: return 13
            case Resources.R4: return 2
            case Resources.R5: return 1
            default: throw new Error('Class Error: ' + c);
        }
    }

    // 採集獎勵
    // number | Array<number>
    // [1, 2, 3, 4, 5, 6] // Building level
    // [0, 2, 5]
    // 3
    static R4_GEN_RATE = 1.0;
}

/**
 * Monster
 */

export class Monster {

    // static M1 = {
    //     GEN_AREA: new Area([new Rect(1, 6, 6, 4)], []),
    //     GEN_PERIOD: 2 * 1000,
    //     GEN_MAX: 10,
    //     MAX_LIFE: 3,
    // }

    // static M2 = {
    //     GEN_AREA: new Area([new Rect(8, 6, 5, 4)], []),
    //     GEN_PERIOD: 2.5 * 1000,
    //     GEN_MAX: 9,
    //     MAX_LIFE: 4,
    // }

    // static M3 = {
    //     GEN_AREA: new Area([new Rect(16, 12, 4, 5)], []),
    //     GEN_PERIOD: 3.0 * 1000,
    //     GEN_MAX: 8,
    //     MAX_LIFE: 3,
    // }

    // static M4 = {
    //     GEN_AREA: new Area([new Rect(8, 0, 5, 5)], []),
    //     GEN_PERIOD: 3.5 * 1000,
    //     GEN_MAX: 8,
    //     MAX_LIFE: 4,
    // }

    static GEN_PERIOD(c: Monsters): number {
        switch (c) {
            case Monsters.M1: return 2.0 * 1000;
            case Monsters.M2: return 2.5 * 1000;
            case Monsters.M3: return 3.0 * 1000;
            case Monsters.M4: return 3.5 * 1000;
            case Monsters.M5: return 4.0 * 1000;
            case Monsters.M6: return 5.0 * 1000;
            case Monsters.M7: return 99.0 * 1000;
            case Monsters.M8: return 99.0 * 1000;
            case Monsters.M9: return 99.0 * 1000;
            default: throw new Error('Class Error: ' + c);
        }
    }

    static GEN_AREA(c: Monsters): Area {
        switch (c) {
            case Monsters.M1: return new Area([new Rect(1, 6, 6, 4)], [])
            case Monsters.M2: return new Area([new Rect(8, 6, 5, 4)], [])
            case Monsters.M3: return new Area([new Rect(16, 12, 4, 5)], []);
            case Monsters.M4: return new Area([new Rect(8, 0, 5, 5)], []);
            case Monsters.M5: return new Area([new Rect(20, 6, 6, 4)], []);
            case Monsters.M6: return new Area([new Rect(14, 0, 5, 5)], []);
            case Monsters.M7: return new Area([new Rect(2, 2, 1, 1)], []);
            case Monsters.M8: return new Area([new Rect(25, 17, 1, 1)], []);
            case Monsters.M9: return new Area([new Rect(22, 2, 1, 1)], []);
            default: throw new Error('Class Error: ' + c);
        }
    }

    static GEN_MAX(c: Monsters): number {
        switch (c) {
            case Monsters.M1: return 10;
            case Monsters.M2: return 9;
            case Monsters.M3: return 8;
            case Monsters.M4: return 8;
            case Monsters.M5: return 8;
            case Monsters.M6: return 8;
            case Monsters.M7: return 1;
            case Monsters.M8: return 1;
            case Monsters.M9: return 1;
            default: throw new Error('Class Error: ' + c);
        }
    }

    static MAX_LIFE(c: Monsters): number {
        switch (c) {
            case Monsters.M1: return 3;
            case Monsters.M2: return 4;
            case Monsters.M3: return 6;
            case Monsters.M4: return 9;
            case Monsters.M5: return 12;
            case Monsters.M6: return 15;
            case Monsters.M7: return 150;
            case Monsters.M8: return 180;
            case Monsters.M9: return 230;
            default: throw new Error('Class Error: ' + c);
        }
    }
}

/**
 * Building
 */
export enum Buildings {
    B1 = 'B1',
    B2 = 'B2',
    B3 = 'B3',
    B4 = 'B4',
    B5 = 'B5',
}

export class Building {

    static MAX_LEVEL = 5;
    static MAX_EXP(c: string, level: number): number {
        // switch (c) {
        //     case 'b1': return level * 5;
        //     case 'b2': return level * 5;
        //     case 'b3': return level * 5;
        //     case 'b4': return level * 5;
        //     case 'b5': return level * 5;
        // }
        return level * 5;
    }

    static POINT(c: Buildings): Point {
        switch (c) {
            case Buildings.B1: return new Point(1, 12);
            case Buildings.B2: return new Point(1, 16);
            case Buildings.B3: return new Point(5, 16);
            case Buildings.B4: return new Point(5, 12);
            case Buildings.B5: return new Point(8, 14);
            default: throw new Error('Class Error: ' + c);
        }

    }

}

