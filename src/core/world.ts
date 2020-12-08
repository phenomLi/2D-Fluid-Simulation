import { Cell } from "./cell";
import { Particle } from "./particle";
import { Plane } from "./plane";
import { Vector, _tempVector3 } from "./../common/vector";
import * as PIXI from 'pixi.js';
import { FluidOptions } from "./core";



export class World {
    private width: number;
    private height: number;
    private cellWidth: number = 20;
    private cells: Cell[] = [];
    private planes: Plane[] = [];
    canvas;


    constructor(width: number, height: number, options: FluidOptions = {}) {
        this.width = width;
        this.height = height;

        this.canvas = new PIXI.Application({
            width: width, 
            height: height,
            antialias: true
        });

        this.canvas.renderer.backgroundColor = options.backgroundColor || 0x000000;

        let row = Math.ceil(this.width / this.cellWidth),
            col = Math.ceil(this.height / this.cellWidth),
            cell: Cell = null;

        for(let i = 0; i < row; i++) {
            for(let j = 0; j < col; j++) {
                cell = new Cell(new Vector(j * this.cellWidth, i * this.cellWidth), i + j);
                cell.initBound(this.cellWidth);
                this.cells.push(cell);
            }
        }

        for(let i = 0; i < this.cells.length; i++) {
            let c = this.cells[i],
                neighborIndex = [
                    c.index - row - 1, c.index - row, c.index - row + 1,
                    c.index - 1, c.index + 1,
                    c.index + row - 1, c.index + row, c.index + row + 1
                ];

            neighborIndex.forEach(item => {
                this.cells[item] && c.neighborCells.push(this.cells[item]);
            });
        }
    }

    /**
     * 添加粒子
     * @param p 
     */
    addParticle(p: Particle) {
        this.canvas.stage.addChild(p.shape);
    }

    /**
     * 添加平面
     * @param start 
     * @param end 
     * @param friction 
     */
    addPlane(start: Vector, end: Vector, friction: number) {
        this.planes.push(new Plane(start, end, friction));
    }

    /**
     * 获取潜在的邻居粒子
     * @param p 
     */
    getPossibleNeighbors(p: Particle): Particle[] {
        let cell: Cell = this.cells[p.cellIndex],
            nCell: Cell,
            neighborParticles: Particle[] = [];

        if(cell === undefined) return [];

        for(let i = 0; i < cell.neighborCells.length; i++) {
            nCell = cell.neighborCells[i];
            neighborParticles = neighborParticles.concat(nCell.particles);
        }

        return neighborParticles;
    }

    /**
     * 找出粒子最接近的平面的距离
     * @param planes 
     */
    getClosestPlane(particle: Particle): Plane {
        let cell = this.cells[particle.cellIndex];

        if(cell === undefined || cell.innerPlanes.length === 0) {
            return null;
        }

        let planes: Plane[] = cell.innerPlanes,
            dis: number = 0,
            index: number = -1,
            minDis: number = Infinity;

        for(let i = 0; i < planes.length; i++) {
            dis = planes[i].getDistance(particle);

            if(dis < minDis) {
                minDis = dis;
                index = i;
            }
        }

        return planes[index];
    }

    /**
     * 更新粒子网格位置
     * @param p 
     */
    updateParticlePosition(p: Particle) {
        if(this.isOutOfWorld(p)) {
            p.cellIndex = -1;
            return;
        }

        if(p.cellIndex > 0) {
            let nCells = this.cells[p.cellIndex].neighborCells;

            for(let i = 0; i < nCells.length; i++) {
                let c = nCells[i];
    
                if(c.isContainsParticle(p)) {
                    c.particles.push(p);
                    break;
                }
            }
        }
        

        for(let i = 0; i < this.cells.length; i++) {
            let c = this.cells[i];

            if(c.isContainsParticle(p)) {
                c.particles.push(p);
                break;
            }
        }
    }

    /**
     * 粒子是否处于可视世界外
     * @param p 
     */
    isOutOfWorld(p: Particle): boolean {
        return p.position.x < 0 || p.position.y < 0 ||
            p.position.x > this.width || p.position.y > this.height;
    }
};
