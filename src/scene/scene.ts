/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn /
 */
namespace scene {
    export class Scene extends THREE.Object3D{
        private m_type = 'Scene';
        private m_background = null;
        private m_fog = null;
        private m_overrideMaterial = null;
        private m_autoUpdate: boolean = true; // checked by the renderer
        constructor() {
            super();
        }

        get fog() {
            return this.m_fog;
        }

        get overrideMaterial() {
            return this.m_overrideMaterial;
        }

        get autoUpdate() {
            return this.m_autoUpdate;
        }

        get background() {
            return this.m_background;
        }

        copy(source: Scene, recursive?: boolean): Scene {
            let that = this;
            super.copy(source, recursive);
            if ( source.m_background !== null ) 
                that.m_background = source.m_background.clone();
            if ( source.m_fog !== null ) 
                that.m_fog = source.m_fog.clone();
            if ( source.m_overrideMaterial !== null ) 
                this.m_overrideMaterial = source.m_overrideMaterial.clone();
    
            that.m_autoUpdate = source.m_autoUpdate;
            that.matrixAutoUpdate = source.matrixAutoUpdate; ///< inherit from THREE.Object3D
    
            return that;
        }

        toJSON(meta): void {
            let that = this;
            let data = super.toJSON(meta);
    
            if ( that.m_background !== null ) 
                data.object.background = that.m_background.toJSON( meta );
            if ( that.m_fog !== null ) 
                data.object.fog = that.m_fog.toJSON();
    
            return data;
        }
    }
}