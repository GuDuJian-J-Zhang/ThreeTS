/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn /
 */
namespace scene {
    export class Scene extends THREE.Object3D{
        private m_type = 'Scene';
        private m_background: THREE.Color = null;
        private m_fog: IFog = null;
        private m_overrideMaterial = null;
        private m_autoUpdate: boolean = true; // checked by the renderer
        constructor() {
            super();
        }

        get fog(): IFog {
            return this.m_fog;
        }

        set fog(val: IFog) {
            this.m_fog = val;
        }

        get overrideMaterial() {
            return this.m_overrideMaterial;
        }

        get autoUpdate(): boolean {
            return this.m_autoUpdate;
        }

        get background(): THREE.Color {
            return this.m_background;
        }

        set background(val: THREE.Color) {
            this.m_background = val;
        }

        copy(source: Scene, recursive?: boolean): any {
            let that = this;
            super.copy(<this>source, recursive);
            if ( source.background !== null )
                that.background = source.background.clone();
            if ( source.fog !== null )
                that.fog = source.fog.clone();
            if ( source.overrideMaterial !== null )
                this.m_overrideMaterial = source.overrideMaterial.clone();
    
            that.m_autoUpdate = source.m_autoUpdate;
            that.matrixAutoUpdate = source.matrixAutoUpdate; ///< inherit from THREE.Object3D
    
            return that;
        }

        toJSON(meta): void {
            let that = this;
            let data = super.toJSON(meta);
    
            // if ( that.m_background !== null )
            //     data.object.background = that.m_background.toJSON( meta );
            if ( that.m_fog !== null )
                data.object.fog = that.m_fog.toJSON();
    
            return data;
        }
    }
}