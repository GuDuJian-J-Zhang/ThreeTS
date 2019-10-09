/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
import {THREE}  from '../3rd';

export interface IFog {
    name: string;
    color: THREE.Color;
    clone(): IFog;
    toJSON(): any;
}

export class Fog implements IFog {
    private m_name: string = '';
    private m_color: THREE.Color = null;
    private m_near: number = 1;
    private m_far: number = 1000;
    private static s_fog: boolean = true;
    constructor(color: number, near: number = 1, far: number = 1000) {
        this.m_color = new THREE.Color( color );;
        this.m_near = near;
        this.m_far = far;
    }

    get name(): string {
        return this.m_name;
    }

    get color(): THREE.Color {
        return this.m_color;
    }

    get near(): number {
        return this.m_near;
    }

    get far(): number {
        return this.m_far;
    }

    clone(): IFog {
        let that = this;
        return new Fog( that.m_color.getHex(), that.m_near, that.m_far );
    }

    toJSON(): Object {
        let that = this;
        return {
            type: 'Fog',
            color: this.m_color.getHex(),
            near: that.m_near,
            far: that.m_far
        };
    }
}
