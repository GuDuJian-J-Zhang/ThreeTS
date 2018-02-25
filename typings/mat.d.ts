/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 * Data: 2018-02-25
 */
declare namespace material {
    interface LineBasicMaterialParameters extends THREE.MaterialParameters {
        color?: THREE.Color | string | number;
        linewidth?: number;
        linecap?: string;
        linejoin?: string;
    }
    class LineBasicMaterial extends THREE.Material {
        isLineBasicMaterial: boolean;
        private m_color;
        private m_linewidth;
        private m_linecap;
        private m_linejoin;
        constructor(parameters: LineBasicMaterialParameters);
        readonly color: THREE.Color;
        readonly linewidth: number;
        readonly linecap: string;
        readonly linejoin: string;
        setValues(parameters: LineBasicMaterialParameters): void;
        copy(source: this): this;
    }
}
