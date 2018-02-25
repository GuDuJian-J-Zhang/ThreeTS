/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 * Data: 2018-02-25
 */
namespace material {
    export interface LineBasicMaterialParameters extends THREE.MaterialParameters {
        color?: THREE.Color | string | number;
        linewidth?: number;
        linecap?: string;
        linejoin?: string;
    }

    export class LineBasicMaterial extends THREE.Material{
        public isLineBasicMaterial: boolean = true;
        private m_color: THREE.Color = new THREE.Color( 0xffffff );
        private m_linewidth: number = 1;
        private m_linecap: string = 'round';
        private m_linejoin: string = 'round';
        constructor(parameters: LineBasicMaterialParameters) {
            super();
            this.type = 'LineBasicMaterial';
            this.lights = false;
            
            this.setValues( parameters );
        }

        get color(): THREE.Color {
            return this.m_color;
        }

        get linewidth(): number {
            return this.m_linewidth;
        }

        get linecap(): string {
            return this.m_linecap;
        }

        get linejoin(): string {
            return this.m_linejoin;
        }

        setValues(parameters: LineBasicMaterialParameters): void {
            this.m_linewidth = parameters.linewidth ? parameters.linewidth : 1;
	        this.m_linecap = parameters.linecap ? parameters.linecap : 'round';
            this.m_linejoin = parameters.linejoin ? parameters.linejoin : 'round';
            super.setValues(parameters);
        }

        copy(source: this): this {
            super.copy(source);
            this.m_color.copy( source.color );

	        this.m_linewidth = source.linewidth;
	        this.m_linecap = source.linecap;
	        this.m_linejoin = source.linejoin;

	        return this;
        }
    }
}
