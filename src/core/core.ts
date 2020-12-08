import { World } from "./world";
import { Particle } from "./particle";
import { Vector, _tempVector1, _tempVector2, _tempVector3 } from "./../common/vector";
import { Util } from "../common/util";


export interface FluidOptions {
    particleNumber?: number;
    gravity?: Vector;
    radius?: number;
    collisionRadius?: number;
    restDensity?: number;
    linearViscosity?: number;
    quadraticViscosity?: number;
    stiffness?: number;
    nearStiffness?: number;
    collisionSoftness?: number;
    backgroundColor?: number;
};


export class FluidCore {
    private particles: Particle[] = [];
    private neighbors: { [id: string]: Particle[] } = {};
    private world: World;

    private particleNumber: number = 10;
    private gravity: Vector = new Vector(0, 9);
    private radius: number = 2;
    private collisionRadius: number = 0.2;
    private restDensity: number = 30;
    private linearViscosity: number = 3;
    private quadraticViscosity: number = 5;
    private stiffness: number = 0.7;
    private nearStiffness: number = 0.4;
    private collisionSoftness: number = 0.1;
    private particleColor: number = 0x3d84a8;

    constructor(world: World, options: FluidOptions) {
        this.world = world;

        Util.merge(this, options);

        for(let i = 0; i < this.particleNumber; i++) {
            let p = new Particle(this.radius, this.particleColor);
            this.particles.push(p);
            this.world.addParticle(p);
        }
    }

    /**
     * 施加外力
     * @param dt 
     */
    private applyExternalForces(dt: number) {
        for(let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];

            p.velocity.x += this.gravity.x * dt;
            p.velocity.y += this.gravity.y * dt;
        }
    }

    /**
     * 应用流体粘度
     * @param dt 
     */
    private applyViscosity(dt: number) {
        for(let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i],
                neighbors = this.neighbors[p.id];

            if(neighbors === undefined) continue;

            for(let j = 0; j < neighbors.length; j++) {
                let n = neighbors[j],
                    relativePosition = n.position.sub(p.position, _tempVector1),
                    relativeVelocity = p.velocity.sub(n.velocity, _tempVector2).dot(relativePosition),
                    length;

                if(relativeVelocity <= 0) continue;

                length = relativePosition.len();
                relativeVelocity = relativeVelocity / length;
                relativePosition = relativePosition.nol();
                
                let q = length / this.radius,
                    impulse = 0.5 * dt * (1 - q) * (this.linearViscosity * relativeVelocity + this.quadraticViscosity * relativeVelocity ** 2);

                p.velocity.x -= impulse * relativePosition.x;
                p.velocity.y -= impulse * relativePosition.y;
            }
        }
    }

    /**
     * 更新粒子位置
     * @param dt 
     */
    private updateParticlePosition(dt: number) {
        for(let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];

            p.prevPosition.x = p.position.x;
            p.prevPosition.y = p.position.y;

            p.position.x += p.velocity.x * dt;
            p.position.y += p.velocity.y * dt;

            this.world.updateParticlePosition(p);
        }
    }

    /**
     * 更新邻居粒子
     */
    private updateNeighbors() {
        for(let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];

            if(this.neighbors[p.id] === undefined) {
                this.neighbors[p.id] = [];
            }
            else {
                this.neighbors[p.id].length = 0;
            }

            if(this.world.isOutOfWorld(p)) continue;
            
            let possibleNeighbors = this.world.getPossibleNeighbors(p);

            for(let j = 0; j < possibleNeighbors.length; j++) {
                let n = possibleNeighbors[j],
                    distanceSquare = (p.position.x - n.position.x) ** 2 + (p.position.y - n.position.y) ** 2;

                if(distanceSquare < this.radius ** 2) {
                    this.neighbors[p.id].push(n);
                }
            }
        }
    }

    /**
     * 修正密度
     * @param dt 
     */
    private doubleDensityRelaxation(dt: number) {
        for(let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i],
                neighbors = this.neighbors[p.id],
                density = 0,
                nearDensity = 0,
                n: Particle,
                relativePosition,
                length, q;

            for(let j = 0; j < neighbors.length; j++) {
                n = neighbors[j];
                length = p.position.sub(n.position, _tempVector1).len();
                q = 1 - length / this.radius;
                density += q ** 2;
                nearDensity += q ** 3;
            }

            let P = this.stiffness * (density - this.restDensity),
                nearP = this.nearStiffness * nearDensity,
                D = _tempVector2,
                dealt = _tempVector3;

            for(let j = 0; j < neighbors.length; j++) {
                n = neighbors[j];
                relativePosition = p.position.sub(n.position, _tempVector1).nol();
                
                let dScalar = 0.5 * dt ** 2 * (P * q + nearP * q ** 2);
                D.x = dScalar * relativePosition.x;
                D.y = dScalar * relativePosition.y;

                n.position.x += D.x;
                n.position.y += D.y;

                dealt.x -= D.x;
                dealt.y -= D.y;
            }

            p.position.x += dealt.x;
            p.position.y += dealt.y;
        }
    }

    /**
     * 求解粒子与平面的碰撞
     * @param dt 
     */
    private resolveCollision(dt: number) {
        for(let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i],
                plane = this.world.getClosestPlane(p),
                distance = -1;

            if(plane === null) continue;

            distance = plane.getDistance(p);

            if(distance < this.collisionRadius) {
                let vpn = p.position.sub(p.prevPosition, _tempVector1).nol(),
                    normal = plane.getNormal(p),
                    tangent = plane.getTangent(p),
                    friction = dt * plane.friction * vpn.dot(tangent),
                    correction = this.collisionSoftness * (distance + this.collisionRadius);

                normal.x *= correction;
                normal.y *= correction;
                tangent.x *= friction;
                tangent.y *= friction;
                
                p.position.x -= tangent.x;
                p.position.y -= tangent.y;
                p.position.x -= normal.x;
                p.position.y -= normal.y;
            }
        }
    }   

    /**
     * 更新粒子速度
     * @param dt 
     */
    private updateParticleVelocity(dt: number) {
        for(let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];

            p.velocity.x = (p.position.x - p.prevPosition.x) / dt;
            p.velocity.y = (p.position.y - p.prevPosition.y) / dt;                
        }
    }

    /**
     * 整个模拟的主函数
     * @param dt 
     */
    public update(dt: number) {
        this.applyExternalForces(dt);
        this.applyViscosity(dt);
        this.updateParticlePosition(dt);
        this.updateNeighbors();
        this.doubleDensityRelaxation(dt);
        this.resolveCollision(dt);
        this.updateParticleVelocity(dt);
    }

    /**
     * 渲染粒子
     */
    public render() {
        for(let i = 0; i < this.particles.length; i++) {
            this.particles[i].render();
        }
    }
}


