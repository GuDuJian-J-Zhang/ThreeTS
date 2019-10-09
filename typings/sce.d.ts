/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn /
 */
import { IFog } from "./fog";
import { THREE } from '../3rd';
export declare class Scene extends THREE.Object3D {
    private m_type;
    private m_background;
    private m_fog;
    private m_overrideMaterial;
    private m_autoUpdate;
    constructor();
    fog: IFog;
    readonly overrideMaterial: any;
    readonly autoUpdate: boolean;
    background: THREE.Color;
    copy(source: Scene, recursive?: boolean): any;
    toJSON(meta: any): void;
}
export interface IFog {
    name: string;
    color: THREE.Color;
    clone(): IFog;
    toJSON(): any;
}
export declare class Fog implements IFog {
    private m_name;
    private m_color;
    private m_near;
    private m_far;
    private static s_fog;
    constructor(color: number, near?: number, far?: number);
    readonly name: string;
    readonly color: THREE.Color;
    readonly near: number;
    readonly far: number;
    clone(): IFog;
    toJSON(): Object;
}
export declare class FogExp2 implements IFog {
    private m_name;
    private m_color;
    private m_density;
    private static s_isFogExp2;
    constructor(color: number, density?: number);
    readonly name: string;
    readonly color: THREE.Color;
    clone(): IFog;
    toJSON(): object;
}
