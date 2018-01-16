/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn /
 */
declare namespace scene {
    class Scene extends THREE.Object3D {
        private m_type;
        private m_background;
        private m_fog;
        private m_overrideMaterial;
        private m_autoUpdate;
        constructor();
        fog: Fog;
        readonly overrideMaterial: any;
        readonly autoUpdate: boolean;
        background: THREE.Color;
        copy(source: Scene, recursive?: boolean): Scene;
        toJSON(meta: any): void;
    }
}
/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
declare namespace scene {
    class Fog {
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
        clone(): Fog;
        toJSON(): Object;
    }
}
/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
declare namespace scene {
    class FogExp2 {
        private m_name;
        private m_color;
        private m_density;
        private static s_isFogExp2;
        constructor(color: number, density?: number);
        clone(): FogExp2;
        toJSON(): object;
    }
}
