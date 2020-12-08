import { Util } from "../common/util";
import { Vector } from "../common/vector";
import * as PIXI from 'pixi.js';


export class Particle {
    id: number = Util.id();
    prevPosition: Vector = new Vector(100, 100);
    position: Vector = new Vector(100, 100);
    velocity: Vector = new Vector();
    cellIndex: number = -1;
    shape = null;

    constructor(radius: number, color: number) {
        let shape = new PIXI.Graphics();

        shape.beginFill(color, 1);
        shape.position.x = this.position.x;
        shape.position.y = this.position.y;    
        shape.drawCircle(0, 0, radius);

        this.shape = shape;
    }

    render() {
        this.shape.position.x = this.position.x;
        this.shape.position.y = this.position.y; 
    }
}