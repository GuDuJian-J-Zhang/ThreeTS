/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 * Data: 2018-02-25
 */
import { THREE } from '../../src/3rd';
export interface LineBasicMaterialParameters extends THREE.MaterialParameters {
    color?: THREE.Color | string | number;
    linewidth?: number;
    linecap?: string;
    linejoin?: string;
}
export declare class LineBasicMaterial extends THREE.Material {
    isLineBasicMaterial: boolean;
    private m_color;
    private m_linewidth;
    private m_linecap;
    private m_linejoin;
    constructor(parameters: LineBasicMaterialParameters);
    get color(): THREE.Color;
    set color(val: THREE.Color);
    get linewidth(): number;
    set linewidth(val: number);
    get linecap(): string;
    get linejoin(): string;
    setValues(parameters: LineBasicMaterialParameters): void;
    copy(source: this): this;
}
