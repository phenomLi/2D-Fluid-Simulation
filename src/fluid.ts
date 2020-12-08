import { Vector } from "./common/vector";
import { FluidCore, FluidOptions } from "./core/core";
import { World } from "./core/world";




export class Fluid {
    private rafId: number;
    private dt: number;
    private world: World;
    private fluidCore: FluidCore;
    private status: boolean;

    constructor(canvasDOM, width: number, height: number, options: FluidOptions = {}) {
        this.dt = 1 / 60;
        this.world = new World(width, height, options);
        this.fluidCore = new FluidCore(this.world, options);

        canvasDOM.appendChild(this.world.canvas.view);
    }

    static vector(x: number, y: number) {
        return new Vector(x, y);
    }

    /**
     * 添加平面
     * @param start 
     * @param end 
     * @param friction 
     */
    addPlane(start: Vector, end: Vector, friction: number = 0.02) {
        this.world.addPlane(start, end, friction);
    }

    /**
     * 一个tick
     * @param timeStamp 
     */
    tick(timeStamp: number) {
        if(this.status === false) return;

        this.fluidCore.update(this.dt);
        this.fluidCore.render();
        this.rafId = requestAnimationFrame(this.tick.bind(this));
    }

    /**
     * 开始
     */
    start() {
        this.status = true;
        this.tick(0);
    }   

    /**
     * 暂停
     */
    pause() {
        this.status = false;
        cancelAnimationFrame(this.rafId);
    }

    getStatus(): boolean {
        return this.status;
    }
}