/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
import {Loader} from './loader';
import { THREE, Pako }  from '../3rd';
import { Volume } from '../volume/volume';

enum NrrdEncoding {
    GZIP = "gzip",
    GZ = "gz",
    ASCII = "ascii",
    TEXT = "text",
    TXT = "txt",
    HEX = "hex",
    RAW = "raw",
    BZ2 = "bz2", // not support
    BZIP2 = "bzip2" // not support
}

enum NrrdDataArrayType {
    // Uint8Array
    UCHAR = "uchar",
	UNSIGNED_CHAR = "unsigned char",
	UINT8 = "uint8",
    UINT8_T = "uint8_t",

    // Int8Array
    SIGNED_CHAR = "signed char",
	INT8 = "int8",
    INT8_T = "int8_t",

    // Int16Array
    SHORT = "short",
	SHORT_INT = "short int",
	SIGNED_SHORT = "signed short",
	SIGNED_SHORT_INT = "signed short int",
	INT16 = "int16",
    INT16_T = "int16_t",
    
    // Uint16Array
    USHORT = "ushort",
	UNSIGNED_SHORT = "unsigned short",
	UNSIGNED_SHORT_INT = "unsigned short int",
	UINT16 = "uint16",
    UINT16_T = "uint16_t",
    
    // Int32Array
    INT = "int",
	SIGNED_INT = "signed int",
	INT32 = "int32",
    INT32_T = "int32_t",
    
    // Uint32Array
    UINT = "uint",
	UNSIGNED_INT = "unsigned int",
	UINT32 = "uint32",
    UINT32_T = "uint32_t",
    
    // Float32Array
    FLOAT = "float",

    // Float64Array
    DOUBLE = "double"
}

enum NrrdEndiannessType {
    BIG = "big",
    LITTLE = "little"
}

export interface NrrdHeader {
    encoding: NrrdEncoding;
    type: NrrdDataArrayType;
    endian: NrrdEndiannessType;
    dimension: number;
    sizes: number[];
    space?: string;
    space_directions?: THREE.Vector3[];
    spacings?: number[]; // 与space_directions属性互斥（在nrrd文件中一个存在，另外一个就不存在）
    isNrrd: boolean;
}

export class NrrdLoader extends Loader {
    private m_header_obj: NrrdHeader;
    private m_data_pointer: number = 0;
    private m_data: ArrayBuffer;
    private m_native_little_edian: boolean;
    private m_data_array_type;
    constructor(manager?: THREE.LoadingManager) {
        super(manager);
        this.m_header_obj = <NrrdHeader>{};
        this.m_native_little_edian = new Int8Array( new Int16Array( [ 1 ] ).buffer )[ 0 ] > 0;
    }

    load(url: string, onLoad?: (volume: Volume) => void, onProgress?, onError? ): void {
        const that = this;
        const manager: THREE.LoadingManager = that.manager();
        const path = that.path();
        let loader = new THREE.FileLoader(manager);
        loader.setPath(path);
		loader.setResponseType('arraybuffer');
		loader.load(url, (data: ArrayBuffer) => {
            const parsed_data: Volume = that.parse(data);
			onLoad(parsed_data);
		}, onProgress, onError );
    }

    onLoad(data: Volume): void {

    }

    // this parser is largely inspired from the XTK NRRD parser : https://github.com/xtk/X
    parse(data: ArrayBuffer) {
        const that = this;

		that.m_data = data;
		that.m_data_pointer = 0;

		//parse the header
		let bytes = that.scan( 'uchar', data.byteLength );
        const num_bytes: number = bytes.length;
		let header = null;
        let data_start = 0;
        for (let i = 1; i < num_bytes; ++i) {
			if ( bytes[i - 1] == 10 && bytes[i] == 10 ) {
				// we found two line breaks in a row
				// now we know what the header is
				header = that.parseChars( bytes, 0, i - 2 );
				// this is were the data starts
				data_start = i + 1;
				break;
			}
        }

        // parse the header
        that.parseHeader(header);

        // the data without header
        let the_data: ArrayBufferView;
		let the_array_data = bytes.subarray(data_start);
        if (that.m_header_obj.encoding === 'gzip' 
            || that.m_header_obj.encoding === 'gz'
        ) {
			// we need to decompress the datastream
			// here we start the unzipping and get a typed Uint8Array back
			the_array_data = Pako.inflate( new Uint8Array( the_array_data ) ); // eslint-disable-line no-undef

        } else if (that.m_header_obj.encoding === "ascii" 
                   || that.m_header_obj.encoding === "text" 
                   || that.m_header_obj.encoding === "txt" 
                   || that.m_header_obj.encoding === "hex"
        ) {
			the_data = that.parseDataAsText(the_array_data, 0, the_array_data.length);

		} else if (that.m_header_obj.encoding === 'raw') {
			//we need to copy the array to create a new array buffer, else we retrieve the original arraybuffer with the header
			let the_copy_array_data = new Uint8Array(the_array_data.length);
			for (let i = 0; i < the_array_data.length; i ++ ) {
				the_copy_array_data[ i ] = the_array_data[ i ];
			}
			the_data = the_copy_array_data;

		}
        // .. let's use the underlying array buffer
        let the_buffer_data = the_array_data.buffer;

        const data4volume = new that.m_data_array_type(the_buffer_data);
		const volume = new Volume(that.m_header_obj, data4volume);
		return volume;
	}
    
    parseChars(array: number[], start: number, end: number): string {
		// without borders, use the whole array
		if (start === undefined) {
			start = 0;
		}
		if (end === undefined) {
			end = array.length;
		}

		let output: string = "";
		// create and append the chars
		for (let i = start; i < end; ++i) {
			output += String.fromCharCode(array[i]);
		}
		return output;
    }
    
    //parse the data when registred as one of this type : 'text', 'ascii', 'txt'
    private parseDataAsText(data: number[], start: number, end: number) {
        const that = this;
        let tmp = "";
        start = start || 0;
        end = end || data.length;
        
        //length of the result is the product of the sizes
        var lengthOfTheResult = that.m_header_obj.sizes.reduce(( previous, current ) => {
            return previous * current;
        }, 1 );

        var base = 10;
        if ( that.m_header_obj.encoding === 'hex' ) {
            base = 16;
        }

        var result = new that.m_data_array_type( lengthOfTheResult );
        
        var parsingFunction = parseInt;
        if ( that.m_data_array_type === Float32Array 
          || that.m_data_array_type === Float64Array
        ) {
            parsingFunction = parseFloat;
        }

        let resultIndex = 0;
        let value: number;
        for (let i = start; i < end; i ++ ) {
            value = data[i];
            //if value is not a space
            if ( ( value < 9 || value > 13 ) && value !== 32 ) {
                tmp += String.fromCharCode( value );
            } else {
                if ( tmp !== "" ) {
                    result[resultIndex] = parsingFunction( tmp, base );
                    resultIndex ++;
                }
                tmp = '';
            }
        }
        if ( tmp !== '' ) {
            result[ resultIndex ] = parsingFunction( tmp, base );
            resultIndex ++;
        }
        return result;
    }

    private parseHeader(header: string) {

        const that = this;
        const lines: string[] = header.split( /\r?\n/ );
        const num_lines = lines.length;
        for ( let i = 0; i < num_lines; ++i) {
            let line_tmp = lines[i];
            if (line_tmp.match( /NRRD\d+/ )) {
                that.m_header_obj.isNrrd = true;
            } else if (line_tmp.match( /^#/ )) {
                continue;
            } else {
                let m = line_tmp.match( /(.*):(.*)/ );
                if (!m) {
                    continue;
                }
                let field: string = m[1].trim();
                let data: string = m[2].trim();
                if (field === "type") {
                    that.setDataType(data);
                } else if (field === "endian") {
                    that.setEndian(data);
                } else if (field === "encoding") {
                    that.setEncoding(data);
                } else if (field === "space dimension") {
                    that.setDimension(parseInt(data));
                } else if (field === "sizes") {
                    that.setSizes(data);
                } else if (field === "space") {
                    // space 通常为可选参数，与space dimension存在其一即可
                    that.setSpace(data);
                } else if (field === "space origin") {
                    that.setSpaceOrigin(data);
                } else if (field === "space directions") {
                    that.setSpaceDirections(data);
                } else if (field === "spacings") {
                    that.setSpacings(data);
                }
            }
        }
        if (!that.m_header_obj.isNrrd) {
            throw new Error( 'Not an NRRD file' );
        }
        if (that.m_header_obj.encoding === NrrdEncoding.BZ2 
            || that.m_header_obj.encoding === NrrdEncoding.BZIP2
        ) {
            throw new Error( 'Bzip is not supported' );
        }
        if (!that.m_header_obj.space_directions) {
            //if no space direction is set, let's use the identity
            that.m_header_obj.space_directions = [ 
                new THREE.Vector3( 1, 0, 0 ), 
                new THREE.Vector3( 0, 1, 0 ), 
                new THREE.Vector3( 0, 0, 1 ) ];
            //apply spacing if defined
            if ( that.m_header_obj.spacings ) {
                for (let i = 0; i <= 2; i ++ ) {
                    if ( !isNaN( that.m_header_obj.spacings[ i ] ) ) {
                        that.m_header_obj.space_directions[ i ].multiplyScalar( that.m_header_obj.spacings[ i ] );
                    }
                }
            }
        }
    }

    private setDataType(data_type: string): void {
        const that = this;
        switch (data_type) {

            case NrrdDataArrayType.UCHAR:
            case NrrdDataArrayType.UNSIGNED_CHAR:
            case NrrdDataArrayType.UINT8:
            case NrrdDataArrayType.UINT8_T:
                that.m_data_array_type = Uint8Array;
                break;
            case NrrdDataArrayType.SIGNED_CHAR:
            case NrrdDataArrayType.INT8:
            case NrrdDataArrayType.INT8_T:
                that.m_data_array_type = Int8Array;
                break;
            case NrrdDataArrayType.SHORT:
            case NrrdDataArrayType.SHORT_INT:
            case NrrdDataArrayType.SIGNED_INT:
            case NrrdDataArrayType.SIGNED_SHORT_INT:
            case NrrdDataArrayType.INT16:
            case NrrdDataArrayType.INT16_T:
                that.m_data_array_type = Int16Array;
                break;
            case NrrdDataArrayType.USHORT:
            case NrrdDataArrayType.UNSIGNED_SHORT:
            case NrrdDataArrayType.UNSIGNED_SHORT_INT:
            case NrrdDataArrayType.UINT16:
            case NrrdDataArrayType.UINT16_T:
                that.m_data_array_type = Uint16Array;
                break;
            case NrrdDataArrayType.INT:
            case NrrdDataArrayType.SIGNED_INT:
            case NrrdDataArrayType.INT32:
            case NrrdDataArrayType.INT32_T:
                that.m_data_array_type = Int32Array;
                break;
            case NrrdDataArrayType.UINT:
            case NrrdDataArrayType.UNSIGNED_INT:
            case NrrdDataArrayType.UINT32:
            case NrrdDataArrayType.UINT32_T:
                that.m_data_array_type = Uint32Array;
                break;
            case NrrdDataArrayType.FLOAT:
                that.m_data_array_type = Float32Array;
                break;
            case NrrdDataArrayType.DOUBLE:
                that.m_data_array_type = Float64Array;
                break;
            default:
                throw new Error( 'Unsupported NRRD data type: ' + data_type );

        }
        that.m_header_obj.type = <NrrdDataArrayType>data_type;
    }

    private setEndian(data: string): void {
        const that = this;
        that.m_header_obj.endian = <NrrdEndiannessType>data;
    }

    private setEncoding(data: string): void {
        const that = this;
        that.m_header_obj.encoding = <NrrdEncoding>data;
    }

    private setDimension(data: number): void {
        const that = this;
        that.m_header_obj.dimension = data;
    }

    private setSizes(data: string): void {
        const that = this;
        const str_sizes = data.split( /\s+/ );
        if (!str_sizes) {
            return;
        }
        let result: number[] = [];
        const num_sizes: number = str_sizes.length;
        for (let i = 0; i < num_sizes; ++i) {
            result.push(parseInt(str_sizes[i]));
        }
        that.m_header_obj.sizes = result;
    }

    private setSpaceOrigin(data: string): void {
        const that = this;

    }

    private setSpaceDirections(data: string): void {
        const that = this;
        let result: THREE.Vector3[] = [];
        const parts = data.match( /\(.*?\)/g );
        const num_parts: number = parts.length;
        for (let i = 0; i < num_parts; ++i) {
            const part_tmp = parts[i];
            const ref = part_tmp.slice( 1, - 1 ).split( /,/ );
            const num_ref: number = ref.length;
            let vector: THREE.Vector3 = new THREE.Vector3();

            if (num_ref >= 0) {
                vector.setX(parseFloat(ref[0]));
                if (num_ref >= 1) {
                    vector.setY(parseFloat(ref[1]));
                    if (num_ref >= 2) {
                        vector.setZ(parseFloat(ref[2]));
                    } else {
                        vector.setZ(0.0);
                    }
                } else {
                    vector.setY(0.0);
                    vector.setZ(0.0);
                }
            } else {
                return;
            }
            result.push(vector);
        }
		that.m_header_obj.space_directions = result;
    }

    private setSpacings(data: string): void {
        const that = this;
		const parts = data.split( /\s+/ );
        let results: number[] = [];
        const num_parts: number = parts.length;
		for (let i = 0; i < num_parts; ++i) {

			const f = parts[i];
			results.push( parseFloat( f ) );
        }
        that.m_header_obj.spacings = results;
    }

    private setSpace(data: string): void {
        const that = this;
        that.m_header_obj.space = data;
    }

    private scan(type: string, chunks: number) {
        const that = this;
        if ( chunks === undefined || chunks === null ) {
            chunks = 1;
        }

        let chunk_size = 1;
        let array_type;
        switch ( type ) {
            // 1 byte data types
            case 'uchar':
                array_type = Uint8Array
                break;
            case 'schar':
                array_type = Int8Array;
                break;
                // 2 byte data types
            case 'ushort':
                array_type = Uint16Array;
                chunk_size = 2;
                break;
            case 'sshort':
                array_type = Int16Array;
                chunk_size = 2;
                break;
                // 4 byte data types
            case 'uint':
                array_type = Uint32Array;
                chunk_size = 4;
                break;
            case 'sint':
                array_type = Int32Array;
                chunk_size = 4;
                break;
            case 'float':
                array_type = Float32Array;
                chunk_size = 4;
                break;
            case 'complex':
                array_type = Float64Array;
                chunk_size = 8;
                break;
            case 'double':
                array_type = Float64Array;
                chunk_size = 8;
                break;
        }

        // increase the data pointer in-place
        const start_index: number = that.m_data_pointer;
        const end_index: number = that.m_data_pointer += chunks * chunk_size;
        let sliced_data = that.m_data.slice(start_index, end_index);
        let _bytes = new array_type(sliced_data);

        // if required, flip the endianness of the bytes
        if (!that.m_native_little_edian) {
            // we need to flip here since the format doesn't match the native endianness
            _bytes = that.flipEndianness( _bytes, chunk_size );
        }

        if ( chunks == 1 ) {
            // if only one chunk was requested, just return one value
            return _bytes[ 0 ];
        }
        // return the byte array
        return _bytes;
    }

    //Flips typed array endianness in-place. Based on https://github.com/kig/DataStream.js/blob/master/DataStream.js.
	private flipEndianness(array, chunkSize: number) {
		let u8 = new Uint8Array( 
            array.buffer, 
            array.byteOffset, 
            array.byteLength 
        );
		for ( let i = 0; i < array.byteLength; i += chunkSize ) {
			for (let j = i + chunkSize - 1, k = i; j > k; j--, k++) {
				let tmp = u8[ k ];
				u8[ k ] = u8[ j ];
				u8[ j ] = tmp;
			}
		}
		return array;
	}
}