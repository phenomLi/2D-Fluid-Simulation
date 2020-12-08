import { Bound } from "../common/bound";
import { Vector } from "../common/vector";
import { Particle } from "./particle";
import { Plane } from "./plane";

export class Cell {
    index: number;
    position: Vector;
    innerPlanes: Plane[];
    neighborCells: Cell[];
    particles: Particle[];
    bound: Bound;

    constructor(position: Vector, index: number) {
        this.index = index;
        this.position = position;
        this.innerPlanes = [];
        this.neighborCells = [];
        this.particles = [];
    }

    /**
     * 创建包围盒
     * @param cellWidth 
     */
    initBound(cellWidth: number) {
        let min = this.position,
            max = new Vector(min.x + cellWidth, min.y + cellWidth);

        this.bound = new Bound(min, max);
    }

    /**
     * 是否包含平面
     * @param plane 
     */
    isContainsPlane(plane: Plane): boolean {
        return true;
    }

    /**
     * 是否包含粒子
     * @param p 
     */
    isContainsParticle(p: Particle): boolean {
        return this.bound.contains(p.position);
    }
};