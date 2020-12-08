import { Bound } from "../common/bound";
import { Vector } from "../common/vector";
import { Particle } from "./particle";

export class Plane {
    start: Vector;
    end: Vector;
    normal: Vector;
    tangent: Vector;
    bound: Bound;
    friction: number;

    constructor(start: Vector, end: Vector, friction: number = 0.02) {
        this.start = start;
        this.end = end;
        this.friction = friction;

        this.tangent = this.end.sub(this.start).nol();
        this.normal = this.tangent.nor();
        this.bound = new Bound();
        this.bound.update([this.start, this.end]);
    }

    /**
     * 获取某个粒子到平面的距离
     * @param particle 
     */
    getDistance(particle: Particle): number {    
        return Math.abs(particle.position.dot(this.normal) - this.start.dot(this.normal));
    }

    /**
     * 获取平面法线
     * @param particle 
     */
    getNormal(particle: Particle): Vector {
        return this.normal;
    }

    /**
     * 获取切线
     * @param particle 
     */
    getTangent(particle: Particle): Vector {
        return this.tangent;
    }
};