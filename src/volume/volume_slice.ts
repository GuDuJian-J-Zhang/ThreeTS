import {THREE}  from '../3rd';
import { EVolumeAxis, IData4Extracted, Volume } from './volume';

export class VolumeSlice {
    private m_volume: Volume;
    private m_extracted: IData4Extracted;
    /**
	 * @member {Number} m_index 
     * The index of the slice, if changed, 
     * will automatically call updateGeometry 
     * at the next repaint
	 */
    private m_ras_index: number = -1;
    private m_axis: EVolumeAxis = EVolumeAxis.Z;
    /**
    * @member {Boolean} m_geometry_needs_update 
    * If set to true, updateGeometry will be triggered 
    * at the next repaint
	*/
    private m_geometry_needs_update: boolean;

    /**
	 * @member {HTMLCanvasElement} canvas The final canvas used for the texture
	 */
	/**
	 * @member {CanvasRenderingContext2D} ctx Context of the canvas
	 */
    private m_canvas: HTMLCanvasElement;
    private m_ctx: CanvasRenderingContext2D;
    /**
	 * @member {HTMLCanvasElement} canvasBuffer The intermediary canvas used to paint the data
	 */
	/**
	 * @member {CanvasRenderingContext2D} ctxBuffer Context of the canvas buffer
	 */
    private m_canvas_buffer: HTMLCanvasElement;
    private m_ctx_buffer: CanvasRenderingContext2D;
    private m_mesh: THREE.Mesh;
    private m_geometry: THREE.PlaneBufferGeometry;
    private m_color_map: [];
    constructor(volume: Volume, index: number, axis: EVolumeAxis) {
        const that = this;
        that.m_volume = volume;
        that.m_ras_index = index;
        that.m_axis = axis;
        that.m_geometry_needs_update = false;
        that.m_canvas = document.createElement( "canvas" );
        that.m_canvas_buffer = document.createElement( "canvas" );

        that.initialize();
    }

    get index(): number {
        const that = this;
        return that.m_ras_index;
    }

    set index(value: number) {
        const that = this;
        if (that.m_ras_index === value) {
            return;
        }
        that.m_ras_index = value;
		that.m_geometry_needs_update = true;
    }

    private initialize(): void {
        const that = this;
        that.updateGeometry();

	    let canvasMap = new THREE.Texture( that.m_canvas );
	    canvasMap.minFilter = THREE.LinearFilter;
        canvasMap.wrapS = THREE.ClampToEdgeWrapping;
        canvasMap.wrapT = THREE.ClampToEdgeWrapping;

	    let material = new THREE.MeshBasicMaterial( { 
            map: canvasMap, 
            side: THREE.DoubleSide, 
            transparent: true 
        } );
	    /**
	     * @member {Mesh} mesh The mesh ready to get used in the scene
	     */
	    that.m_mesh = new THREE.Mesh( that.m_geometry, material );
	    that.m_mesh.matrixAutoUpdate = false;
	    /**
	     * @member {Boolean} geometryNeedsUpdate If set to true, updateGeometry will be triggered at the next repaint
	     */
	    this.m_geometry_needs_update = true;
	    this.repaint();
    }

    /**
	 * Refresh the texture and the geometry if geometryNeedsUpdate is set to true
	 * @memberof VolumeSlice
	 */
	repaint() {
        const that = this;
		if ( that.m_geometry_needs_update ) {
			that.updateGeometry();
		}

        const iLength: number = that.m_extracted.iLength;
        const jLength: number = that.m_extracted.jLength;


		// get the imageData and pixel array from the canvas
		const imgData = that.m_ctx_buffer.getImageData( 0, 0, iLength, jLength );
		const data = imgData.data;
		const volumeData = that.m_volume.data;
		const upperThreshold = that.m_volume.upperThreshold;
		const lowerThreshold = that.m_volume.lowerThreshold;
		const windowLow = that.m_volume.windowLow;
		const windowHigh = that.m_volume.windowHigh;

		// manipulate some pixel elements
		let pixelCount = 0;

		if ( that.m_volume['dataType'] === 'label' ) {

			//this part is currently useless but will be used when colortables will be handled
			for ( let j = 0; j < jLength; j ++ ) {
				for ( let i = 0; i < iLength; i ++ ) {
                    const index: number = that.sliceAccess(i,j);
					let label = volumeData[index];
					label = label >= that.m_color_map.length ? ( label % that.m_color_map.length ) + 1 : label;
					let color = that.m_color_map[ label ];
					data[ 4 * pixelCount ] = ( color >> 24 ) & 0xff;
					data[ 4 * pixelCount + 1 ] = ( color >> 16 ) & 0xff;
					data[ 4 * pixelCount + 2 ] = ( color >> 8 ) & 0xff;
					data[ 4 * pixelCount + 3 ] = color & 0xff;
					pixelCount ++;
				}
			}
		} else {

			for ( let j = 0; j < jLength; j ++ ) {
				for ( let i = 0; i < iLength; i ++ ) {
                    const index: number = that.sliceAccess(i,j);
					let value = volumeData[index];
					let alpha = 0xff;
					//apply threshold
					alpha = upperThreshold >= value ? ( lowerThreshold <= value ? alpha : 0 ) : 0;
					//apply window level
					value = Math.floor( 255 * ( value - windowLow ) / ( windowHigh - windowLow ) );
					value = value > 255 ? 255 : ( value < 0 ? 0 : value | 0 );

					data[ 4 * pixelCount ] = value;
					data[ 4 * pixelCount + 1 ] = value;
					data[ 4 * pixelCount + 2 ] = value;
					data[ 4 * pixelCount + 3 ] = alpha;
					++pixelCount;
				}
			}
        }
        if(0)
        { // for test
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');
            context.putImageData(imgData, 0, 0);
            let image = canvas.toDataURL("image/png");
        }

		that.m_ctx_buffer.putImageData( imgData, 0, 0 );
		that.m_ctx.drawImage( 
            that.m_canvas_buffer, 0, 0, iLength, jLength, 
            0, 0, that.m_canvas.width, that.m_canvas.height 
        );

		(<THREE.MeshBasicMaterial>that.m_mesh.material).map.needsUpdate = true;
    }
    
    mesh(): THREE.Mesh {
        const that = this;
        return that.m_mesh;
    }

    /**
    * Refresh the geometry according to axis and index
    * @see Volume.extractPerpendicularPlane
    */
    private updateGeometry() {
        const that = this;
        that.m_extracted = that.m_volume.extractPerpendicularPlane( that.m_axis, that.m_ras_index );
 
        that.m_canvas.width = that.m_extracted.planeWidth;
        that.m_canvas.height = that.m_extracted.planeHeight;
        that.m_canvas_buffer.width = that.m_extracted.iLength;
        that.m_canvas_buffer.height = that.m_extracted.jLength;
 
        that.m_ctx = that.m_canvas.getContext( '2d' );
        that.m_ctx_buffer = that.m_canvas_buffer.getContext( '2d' );
        
        if ( that.m_geometry ) {
            that.m_geometry.dispose(); // dispose existing geometry
        }

        that.m_geometry = new THREE.PlaneBufferGeometry( 
            that.m_extracted.planeWidth, that.m_extracted.planeHeight 
        );

        if (that.m_mesh) {
            that.m_mesh.geometry = that.m_geometry;
            //reset mesh matrix
            that.m_mesh.matrix.identity();
            that.m_mesh.applyMatrix( that.m_extracted.matrix );
        }
        that.m_geometry_needs_update = false;
    }

    private sliceAccess(i: number, j: number): number {
        const that = this;
        let index_x: number = 0;
        let index_y: number = 0;
        let index_z: number = 0;
        const volume_xyz: THREE.Vector3 = that.m_volume.xyzLength();
        if (that.m_axis === EVolumeAxis.X) {
            index_x = volume_xyz.x - 1 - that.m_extracted.ijkIndex;
            index_y = volume_xyz.y - 1 - j;
            index_z = i;
        } else if (that.m_axis === EVolumeAxis.Y) {
            index_x = volume_xyz.x - i - 1;
            index_y = that.m_extracted.ijkIndex;
            index_z = volume_xyz.z - j - 1;
        } else if (that.m_axis === EVolumeAxis.Z) {
            index_x = volume_xyz.x - 1 - i;
            index_y = volume_xyz.y - 1 - j;
            index_z = volume_xyz.z - 1 - that.m_extracted.ijkIndex;
        }
        return that.m_volume.access(index_x, index_y, index_z);
    }
}