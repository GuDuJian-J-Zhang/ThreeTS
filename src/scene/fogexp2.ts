/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
import {IFog} from './fog';
import {THREE}  from '../3rd';

export class FogExp2 implements IFog{
    private m_name: string = '';
    private m_color: THREE.Color = null;
    private m_density: number = 0.00025;
    private static s_isFogExp2: boolean = true;
    constructor(color: number, density: number = 0.00025) {
        this.m_color = new THREE.Color(color);
        this.m_density = density;
    }

    get name(): string {
        return this.m_name;
    }

    get color(): THREE.Color {
        return this.m_color;
    }

    clone(): IFog{
        let that = this;
        return new FogExp2( that.m_color.getHex(), that.m_density );
    }

    toJSON(): object {
        let that = this;
        return {
            type: 'FogExp2',
            color: that.m_color.getHex(),
            density: that.m_density
        };
    }
}