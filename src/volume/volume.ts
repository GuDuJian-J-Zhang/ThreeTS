import { NrrdHeader } from '../loaders/nrrd_loader';
import { VolumeSlice } from '../volume/volume_slice';
import {THREE}  from '../3rd';

export enum EVolumeAxis {
    X = "x",
    Y = "y",
    Z = "z"
}

export interface IData4Extracted {
    iLength: number;
	jLength: number;
	matrix: THREE.Matrix4;
	planeWidth: number;
	planeHeight: number;
	ijkIndex: number;
}

export class Volume {
    private m_x_length: number;
    private m_y_length: number;
    private m_z_length: number;
    private m_min: number;
    private m_max: number;
    private m_windowLow: number;
    private m_windowHigh: number;
    private m_dimensions: number[];
    private m_spacing: number[];
    private m_ijk2ras_matrix: THREE.Matrix4;
    private m_inverse_matrix_of_ijk2ras: THREE.Matrix4;
    private m_lower_threshold: number;
    private m_upper_threshold: number;
    private m_ras_dimensions: number[];
    private m_slice_list: VolumeSlice[] = [];
    private m_nrrd_header: NrrdHeader;
    private m_data: THREE.TypedArray;

    constructor(nrrd_header: NrrdHeader, data) {
        this.m_nrrd_header = nrrd_header;
        this.m_data = data;

        // get the min and max intensities
		const min_max: THREE.Vector2 = this.computeMinMax();
		const min: number = min_max.x;
		const max: number = min_max.y;
		// attach the scalar range to the volume
		this.m_windowLow = min;
		this.m_windowHigh = max;

		// get the image dimensions
		this.m_dimensions = [ 
            nrrd_header.sizes[ 0 ], 
            nrrd_header.sizes[ 1 ], 
            nrrd_header.sizes[ 2 ] 
        ];
		this.m_x_length = this.m_dimensions[ 0 ];
		this.m_y_length = this.m_dimensions[ 1 ];
		this.m_z_length = this.m_dimensions[ 2 ];
		// spacing
		const spacingX: number = nrrd_header.space_directions[0].length();
		const spacingY: number = nrrd_header.space_directions[1].length();
		const spacingZ: number = nrrd_header.space_directions[2].length();
		this.m_spacing = [ spacingX, spacingY, spacingZ ];


		// Create IJKtoRAS matrix
		this.m_ijk2ras_matrix = new THREE.Matrix4();
		let _spaceX = 1;
		let _spaceY = 1;
		let _spaceZ = 1;

		if (nrrd_header.space == "left-posterior-superior") {
			_spaceX = - 1;
			_spaceY = - 1;
		} else if (nrrd_header.space === 'left-anterior-superior') {
			_spaceX = - 1;
		}

		if (!nrrd_header.space_directions) {
			this.m_ijk2ras_matrix.set(
				_spaceX, 0, 0, 0,
				0, _spaceY, 0, 0,
				0, 0, _spaceZ, 0,
				0, 0, 0, 1 );
		} else {
			const v = nrrd_header.space_directions;
			this.m_ijk2ras_matrix.set(
				_spaceX * v[ 0 ].x, _spaceX * v[ 1 ].x, _spaceX * v[ 2 ].x, 0,
				_spaceY * v[ 0 ].y, _spaceY * v[ 1 ].y, _spaceY * v[ 2 ].y, 0,
				_spaceZ * v[ 0 ].z, _spaceZ * v[ 1 ].z, _spaceZ * v[ 2 ].z, 0,
				0, 0, 0, 1 );
		}

		this.m_inverse_matrix_of_ijk2ras = new THREE.Matrix4();
        this.m_inverse_matrix_of_ijk2ras.getInverse( this.m_ijk2ras_matrix );
        let bbox = new THREE.Vector3( 
                        this.m_x_length, 
                        this.m_y_length, 
                        this.m_z_length 
                    );
        bbox = bbox.applyMatrix4(this.m_ijk2ras_matrix);
        let bbox_rounded = bbox.round(); //round方法用来返回最接近三维向量的(x,y,z)坐标值的整数
		this.m_ras_dimensions = bbox_rounded.toArray().map(Math.abs);

		// .. and set the default threshold
        // only if the threshold was not already set
        this.m_lower_threshold = min;
        this.m_upper_threshold = max;
    }

    /**
	 * Shortcut for data[access(i,j,k)]
	 * @param {number} i    First coordinate
	 * @param {number} j    Second coordinate
	 * @param {number} k    Third coordinate
	 * @returns {number}  value in the data array
	 */
	getData(i: number, j: number, k: number ): any {
        const that = this;
        const index: number = that.access(i, j, k);
		return that.m_data[index];
    }
    
    /**
	 * compute the index in the data array corresponding to the given coordinates in IJK system
	 * @param {number} i    First coordinate
	 * @param {number} j    Second coordinate
	 * @param {number} k    Third coordinate
	 * @returns {number}  index
	 */
	access(i: number, j: number, k: number): number {
        const that = this;
        return k * that.m_x_length * that.m_y_length 
               + j * that.m_x_length
               + i;
    }
    
    /**
	 * Retrieve the IJK coordinates of the voxel corresponding of the given index in the data
	 * @memberof Volume
	 * @param {number} index index of the voxel
	 * @returns {Array}  [x,y,z]
	 */
	reverseAccess(index: number): number[] {
        const that = this;
		var z = Math.floor( index / ( that.m_x_length * that.m_y_length ) );
		var y = Math.floor( ( index - z * that.m_y_length * that.m_x_length ) / that.m_x_length );
		var x = index - z * that.m_y_length * that.m_x_length - y * that.m_x_length;
		return [ x, y, z ];
    }
    
    /**
	 * Apply a function to all the voxels, be careful, the value will be replaced
	 * @memberof Volume
	 * @param {Function} functionToMap A function to apply to every voxel, will be called with the following parameters :
	 *                                 value of the voxel
	 *                                 index of the voxel
	 *                                 the data (TypedArray)
	 * @returns {Volume}   this
	 */
	map(functionToMap: Function): Volume {
        const that = this;
		const length = that.m_data.length;
		for (let i = 0; i < length; ++i) {
			that.m_data[ i ] = functionToMap.call( 
                                   that, 
                                   that.m_data[ i ], 
                                   i, 
                                   that.m_data 
                               );
		}
		return that;
    }

    /**
	 * Compute the orientation of the slice and 
     * returns all the information relative to 
     * the geometry such as sliceAccess, 
     * the plane matrix (orientation and position in RAS coordinate) 
     * and the dimensions of the plane in both coordinate system.
	 * @param {EVolumeAxis}            axis  the normal axis to the slice 'x' 'y' or 'z'
	 * @param {number}            RASIndex the index of the slice
	 * @returns {Object} an object containing all the usefull information on the geometry of the slice
	 */
	extractPerpendicularPlane(axis: EVolumeAxis, RASIndex: number): IData4Extracted {
        const that = this;
        let planeMatrix = new THREE.Matrix4();
        planeMatrix.identity();
		let firstSpacing,
			secondSpacing,
			positionOffset;

		let axisInIJK = new THREE.Vector3();
		let firstDirection = new THREE.Vector3();
		let secondDirection = new THREE.Vector3();

		const dimensions = new THREE.Vector3(
                                    that.m_x_length, 
                                    that.m_y_length, 
                                    that.m_z_length
						   );
		let IJKIndex: THREE.Vector3;
		switch (axis) {
			case EVolumeAxis.X :
				axisInIJK.set( 1, 0, 0 );
				firstDirection.set( 0, 0, - 1 );
				secondDirection.set( 0, - 1, 0 );
				firstSpacing = that.m_spacing[ 2 ];
				secondSpacing = that.m_spacing[ 1 ];
				IJKIndex = new THREE.Vector3( RASIndex, 0, 0 );

				planeMatrix.multiply( ( new THREE.Matrix4() ).makeRotationY( Math.PI / 2 ) );
				positionOffset = ( that.m_ras_dimensions[ 0 ] - 1 ) / 2;
				planeMatrix.setPosition( new THREE.Vector3( RASIndex - positionOffset, 0, 0 ) );
				break;
			case EVolumeAxis.Y :
				axisInIJK.set( 0, 1, 0 );
				firstDirection.set( 1, 0, 0 );
				secondDirection.set( 0, 0, 1 );
				firstSpacing = that.m_spacing[ 0 ];
				secondSpacing = that.m_spacing[ 2 ];
				IJKIndex = new THREE.Vector3( 0, RASIndex, 0 );

				planeMatrix.multiply( ( new THREE.Matrix4() ).makeRotationX( - Math.PI / 2 ) );
				positionOffset = ( that.m_ras_dimensions[ 1 ] - 1 ) / 2;
				planeMatrix.setPosition( new THREE.Vector3( 0, RASIndex - positionOffset, 0 ) );
				break;
			case EVolumeAxis.Z :
			default :
				axisInIJK.set( 0, 0, 1 );
				firstDirection.set( 1, 0, 0 );
				secondDirection.set( 0, - 1, 0 );
				firstSpacing = that.m_spacing[ 0 ];
                secondSpacing = that.m_spacing[ 1 ];
				IJKIndex = new THREE.Vector3( 0, 0, RASIndex );
				
				positionOffset = ( that.m_ras_dimensions[ 2 ] - 1 ) / 2;
				planeMatrix.setPosition( new THREE.Vector3( 0, 0, RASIndex - positionOffset ) );
				break;
        }

		firstDirection.applyMatrix4( that.m_inverse_matrix_of_ijk2ras ).normalize();
        
		secondDirection.applyMatrix4( that.m_inverse_matrix_of_ijk2ras ).normalize();
        
		axisInIJK.applyMatrix4( that.m_inverse_matrix_of_ijk2ras ).normalize();
		const iLength: number = Math.floor( Math.abs( firstDirection.dot( dimensions ) ) );
		const jLength: number = Math.floor( Math.abs( secondDirection.dot( dimensions ) ) );
		const planeWidth: number = Math.abs( iLength * firstSpacing );
		const planeHeight: number = Math.abs( jLength * secondSpacing );
		const ijkIndex: number = Math.abs( Math.round( IJKIndex.applyMatrix4( that.m_inverse_matrix_of_ijk2ras ).dot( axisInIJK ) ) );

		return {
			iLength: iLength,
			jLength: jLength,
			matrix: planeMatrix,
			planeWidth: planeWidth,
			planeHeight: planeHeight,
			ijkIndex: ijkIndex
		};
	}

    /**
	 * Returns a slice corresponding to the given axis and index
	 *                        The coordinate are given in the Right Anterior Superior coordinate format
	 * @memberof Volume
	 * @param {string}            axis  the normal axis to the slice 'x' 'y' or 'z'
	 * @param {number}            index the index of the slice
	 * @returns {VolumeSlice} the extracted slice
	 */
	extractSlice(axis: EVolumeAxis, index: number): VolumeSlice {
        const that = this;
		const slice = new VolumeSlice( that, index, axis );
		that.m_slice_list.push( slice );
		return slice;
	}

    /**
	 * Call repaint on all the slices extracted from this volume
	 * @see VolumeSlice.repaint
	 * @memberof Volume
	 * @returns {Volume} this
	 */
	repaintAllSlices(): Volume {
        const that = this;
		that.m_slice_list.forEach(slice => {
			slice.repaint();
		} );
		return that;
	}
    
    /**
	 * Compute the minimum and the maximum of the data in the volume
	 * @returns {THREE.Vector2} THREE.Vector2(min, max)
	 */
	computeMinMax(): THREE.Vector2 {
        const that = this;
		let min = Infinity;
		let max = - Infinity;

		// buffer the length
		const data_size = that.m_data.length;

		for (let i = 0; i < data_size; ++i) {
			if ( ! isNaN(that.m_data[ i ] ) ) {
				const value = that.m_data[ i ];
				min = Math.min( min, value );
				max = Math.max( max, value );
			}
		}
		that.m_min = min;
		that.m_max = max;

		return new THREE.Vector2(min, max);
	}
	
	xyzLength(): THREE.Vector3 {
		const that = this;
		return new THREE.Vector3(that.m_x_length, that.m_y_length, that.m_z_length);
	}

	matrix(): THREE.Matrix4 {
		const that = this;
		return that.m_ijk2ras_matrix;
	}

	rasDimensions(): number[] {
		const that = this;
		return that.m_ras_dimensions;
	}
    
    get data(): THREE.TypedArray {
        const that = this;
        return that.m_data;
    }

    get upperThreshold(): number {
        const that = this;
        return that.m_upper_threshold;
    }

    get lowerThreshold(): number {
        const that = this;
        return that.m_lower_threshold;
    }

    get windowLow(): number {
        const that = this;
        return that.m_windowLow;
    }

    get windowHigh(): number {
        const that = this;
        return that.m_windowHigh;
    }
}