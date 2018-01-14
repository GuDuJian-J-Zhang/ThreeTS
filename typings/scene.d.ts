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
        readonly fog: any;
        readonly overrideMaterial: any;
        readonly autoUpdate: boolean;
        readonly background: any;
        copy(source: Scene, recursive?: boolean): Scene;
        toJSON(meta: any): void;
    }
}
