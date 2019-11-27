/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
import {THREE}  from '../3rd';
import { ThrowStatement } from 'babel-types';

interface IData4SceenSize {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface IData4MouseButtons {
    LEFT: THREE.MOUSE;
    MIDDLE: THREE.MOUSE;
    RIGHT: THREE.MOUSE;
}

enum EState {
    NONE = - 1, 
    ROTATE = 0, 
    ZOOM = 1, 
    PAN = 2, 
    TOUCH_ROTATE = 3, 
    TOUCH_ZOOM_PAN = 4
}

const changeEvent = { type: 'change' };
const startEvent = { type: 'start' };
const endEvent = { type: 'end' };

export type PerspectiveOrOrth = THREE.PerspectiveCamera | THREE.OrthographicCamera;

export class TrackballControls {
    private m_camera: PerspectiveOrOrth; // The camera to be controlled
    private m_domElement: HTMLElement; // The HTML element used for event listeners
    private m_enabled: boolean;
    private m_screen: IData4SceenSize;
    private m_rotate_speed: number;
    private m_zoom_speed: number;
    private m_pan_speed: number;
    private m_no_rotate: boolean;
    private m_no_zoom: boolean;
    private m_no_pan: boolean;
    private m_static_moving: boolean;
    private m_dynamic_damping_factor: number;// 阻尼系数 越小 则滑动越大
    private m_min_distance: number;
    private m_max_distance: number;
    private m_keys: number[];
    private m_mouse_buttons: IData4MouseButtons;
    private m_target: THREE.Vector3;
    private m_EPS: number;
    private m_last_position: THREE.Vector3;
    private m_last_zoom: number;
    private m_state: EState;
    private m_key_state: EState;
    private m_eye: THREE.Vector3;
    private m_move_prev: THREE.Vector2;
    private m_move_curr: THREE.Vector2;
    private m_last_axis: THREE.Vector3;
    private m_last_angle: number;
    private m_zoom_start: THREE.Vector2;
    private m_zoom_end: THREE.Vector2;
    private m_touch_zoom_distance_start: number;
    private m_touch_zoom_distance_end: number;
    private m_pan_start: THREE.Vector2;
    private m_pan_end: THREE.Vector2;
    private m_target0: THREE.Vector3;
    private m_position0: THREE.Vector3;
    private m_up0: THREE.Vector3;
    private m_zoom0: number;

    constructor(camera: PerspectiveOrOrth, domElement: HTMLElement) {
        const that = this;
        that.m_camera = camera;
        that.m_domElement = domElement;
        that.m_enabled = true;
        that.m_screen = {
            left: 0,
            top: 0,
            width: 0,
            height: 0
        };
        that.m_rotate_speed = 1.0;
	    that.m_zoom_speed = 1.2;
        that.m_pan_speed = 0.3;
        
        that.m_no_rotate = false;
	    that.m_no_zoom = false;
	    that.m_no_pan = false;
    
	    that.m_static_moving = false;
	    that.m_dynamic_damping_factor = 0.2;
    
	    that.m_min_distance = 0;
        that.m_max_distance = Infinity;
        
        that.m_keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

	    that.m_mouse_buttons = { 
            LEFT: THREE.MOUSE.ROTATE, 
            MIDDLE: THREE.MOUSE.DOLLY, 
            RIGHT: THREE.MOUSE.PAN 
        };

        // internals

	    that.m_target = new THREE.Vector3();
    
	    that.m_EPS = 0.000001;
    
	    that.m_last_position = new THREE.Vector3();
        that.m_last_zoom = 1;
    
	    that.m_state = EState.NONE;
	    that.m_key_state = EState.NONE;
    
	    that.m_eye = new THREE.Vector3();
    
	    that.m_move_prev = new THREE.Vector2();
	    that.m_move_curr = new THREE.Vector2();
    
	    that.m_last_axis = new THREE.Vector3();
	    that.m_last_angle = 0;
    
	    that.m_zoom_start = new THREE.Vector2(),
	    that.m_zoom_end = new THREE.Vector2(),
    
	    that.m_touch_zoom_distance_start = 0,
	    that.m_touch_zoom_distance_end = 0,
    
	    that.m_pan_start = new THREE.Vector2(),
	    that.m_pan_end = new THREE.Vector2();
    
	    // for reset
    
	    that.m_target0 = that.m_target.clone();
	    that.m_position0 = that.m_camera.position.clone();
	    that.m_up0 = that.m_camera.up.clone();
	    that.m_zoom0 = that.m_camera.zoom;

        that.initialize();
    }

    private initialize(): void {
        const that = this;
        
    }

    handleResize(): void {
        const that = this;
        // getBoundingClientRect用于获取
        // 某个元素相对于视窗的位置集合。
        // 集合中有top, right, bottom, left等属性
        const box = that.m_domElement.getBoundingClientRect();
		// adjustments come from similar code in the jquery offset() function
		const d = that.m_domElement.ownerDocument.documentElement;
		that.m_screen.left = box.left + window.pageXOffset - d.clientLeft;
		that.m_screen.top = box.top + window.pageYOffset - d.clientTop;
		that.m_screen.width = box.width;
		that.m_screen.height = box.height;
    }

    getMouseOnScreen(page_x: number, page_y: number): THREE.Vector2 {
        const that = this;
        let vector = new THREE.Vector2();
        vector.set(
            ( page_x - that.m_screen.left ) / that.m_screen.width,
            ( page_y - that.m_screen.top ) / that.m_screen.height
        );
        return vector;
    }

    getMouseOnCircle(page_x: number, page_y: number): THREE.Vector2 {
        const that = this;
        let vector = new THREE.Vector2();
        const x: number = ( page_x - that.m_screen.width * 0.5 - that.m_screen.left ) / ( that.m_screen.width * 0.5 );
        const y: number = ( that.m_screen.height + 2 * ( that.m_screen.top - page_y ) ) / that.m_screen.width;
        vector.set(x, y);
        return vector;
    }

    rotateCamera(): void {
        const that = this;
        let axis = new THREE.Vector3();
		let quaternion = new THREE.Quaternion();
		let eyeDirection = new THREE.Vector3();
		let objectUpDirection = new THREE.Vector3();
		let objectSidewaysDirection = new THREE.Vector3();
		let moveDirection = new THREE.Vector3();
        
        moveDirection.set( 
            that.m_move_curr.x - that.m_move_prev.x, 
            that.m_move_curr.y - that.m_move_prev.y, 
            0 
        );

        let angle: number = moveDirection.length();

        if ( angle ) {

            that.m_eye.copy( that.m_camera.position ).sub( that.m_target );

            eyeDirection.copy( that.m_eye ).normalize(); // 视线方向
            objectUpDirection.copy( that.m_camera.up ).normalize(); // 上方向
            // 计算视线方向和上方向的叉积
            objectSidewaysDirection.crossVectors( objectUpDirection, eyeDirection ).normalize();

            objectUpDirection.setLength( that.m_move_curr.y - that.m_move_prev.y );
            objectSidewaysDirection.setLength( that.m_move_curr.x - that.m_move_prev.x );

            moveDirection.copy( objectUpDirection.add( objectSidewaysDirection ) );

            axis.crossVectors( moveDirection, that.m_eye ).normalize();

            angle *= that.m_rotate_speed;
            quaternion.setFromAxisAngle( axis, angle );

            that.m_eye.applyQuaternion( quaternion );
            that.m_camera.up.applyQuaternion( quaternion );

            that.m_last_axis.copy( axis );
            that.m_last_angle = angle;

        } else if ( ! that.m_static_moving && that.m_last_angle ) {

            that.m_last_angle *= Math.sqrt( 1.0 - that.m_dynamic_damping_factor );
            that.m_eye.copy( that.m_camera.position ).sub( that.m_target );
            quaternion.setFromAxisAngle( that.m_last_axis, that.m_last_angle );
            that.m_eye.applyQuaternion( quaternion );
            that.m_camera.up.applyQuaternion( quaternion );

        }

        that.m_move_prev.copy( that.m_move_curr );
    }

    zoomCamera(): void {
        const that = this;

		if ( that.m_state === EState.TOUCH_ZOOM_PAN ) {
			const factor: number = that.m_touch_zoom_distance_start / that.m_touch_zoom_distance_end;
			that.m_touch_zoom_distance_start = that.m_touch_zoom_distance_end;
            
            if ( that.m_camera instanceof THREE.PerspectiveCamera) {
				that.m_eye.multiplyScalar( factor );
			} else if ( that.m_camera instanceof THREE.OrthographicCamera ) {
				that.m_camera.zoom *= factor;
				that.m_camera.updateProjectionMatrix();
			} else {
				console.warn( 'THREE.TrackballControls: Unsupported camera type' );
			}
		} else {
			const factor: number = 1.0 + ( that.m_zoom_end.y - that.m_zoom_start.y ) * that.m_zoom_speed;
			if ( factor !== 1.0 && factor > 0.0 ) {
				if ( that.m_camera instanceof THREE.PerspectiveCamera ) {
					that.m_eye.multiplyScalar( factor );
				} else if ( that.m_camera instanceof THREE.OrthographicCamera ) {
					that.m_camera.zoom /= factor;
					that.m_camera.updateProjectionMatrix();
				} else {
					console.warn( 'THREE.TrackballControls: Unsupported camera type' );
				}
			}

			if ( that.m_static_moving ) {
				that.m_zoom_start.copy( that.m_zoom_end );
			} else {
				that.m_zoom_start.y += ( that.m_zoom_end.y - that.m_zoom_start.y ) * that.m_dynamic_damping_factor;
			}
		}
    }
    
    panCamera(): void {
        const that = this;

        let mouseChange = new THREE.Vector2();
		let	objectUp = new THREE.Vector3();
        let pan = new THREE.Vector3();
   
        mouseChange.copy( that.m_pan_end ).sub( that.m_pan_start );

        if ( mouseChange.lengthSq() ) {
            if ( that.m_camera instanceof THREE.OrthographicCamera ) {
                const scale_x = ( that.m_camera.right - that.m_camera.left ) / that.m_camera.zoom / that.m_domElement.clientWidth;
                const scale_y = ( that.m_camera.top - that.m_camera.bottom ) / that.m_camera.zoom / that.m_domElement.clientWidth;

                mouseChange.x *= scale_x;
                mouseChange.y *= scale_y;
            }

            mouseChange.multiplyScalar( that.m_eye.length() * that.m_pan_speed );

            pan.copy( that.m_eye ).cross( that.m_camera.up ).setLength( mouseChange.x );
            pan.add( objectUp.copy( that.m_camera.up ).setLength( mouseChange.y ) );

            that.m_camera.position.add( pan );
            that.m_target.add( pan );

            if ( that.m_static_moving ) {
                that.m_pan_start.copy( that.m_pan_end );
            } else {
                const tmp: THREE.Vector2 = mouseChange.subVectors( that.m_pan_end, that.m_pan_start ).multiplyScalar( that.m_dynamic_damping_factor );
                that.m_pan_start.add( tmp );
            }
        }
    }

    checkDistances(): void {
        const that = this;
		if ( ! that.m_no_zoom || ! that.m_no_pan ) {
            const eye_length_sq: number = that.m_eye.lengthSq();
			if ( eye_length_sq > that.m_max_distance * that.m_max_distance ) {
				that.m_camera.position.addVectors( that.m_target, that.m_eye.setLength( that.m_max_distance ) );
				that.m_zoom_start.copy( that.m_zoom_end );
			}

			if ( that.m_eye.lengthSq() < that.m_min_distance * that.m_min_distance ) {
				that.m_camera.position.addVectors( that.m_target, that.m_eye.setLength( that.m_min_distance ) );
				that.m_zoom_start.copy( that.m_zoom_end );
			}
		}
    }
    
    update(): void {
        const that = this;

		that.m_eye.subVectors( that.m_camera.position, that.m_target );

		if ( !that.m_no_rotate ) {
			that.rotateCamera();
		}

		if ( !that.m_no_zoom ) {
			that.zoomCamera();
		}

		if ( !that.m_no_pan ) {
			that.panCamera();
		}

		that.m_camera.position.addVectors( that.m_target, that.m_eye );

		if (that.m_camera instanceof THREE.PerspectiveCamera) {

			that.checkDistances();

			that.m_camera.lookAt( that.m_target );

			if ( that.m_last_position.distanceToSquared( that.m_camera.position ) > that.m_EPS ) {
				that.dispatchEvent( changeEvent );

				that.m_last_position.copy( that.m_camera.position );
			}

		} else if ( that.m_camera instanceof THREE.OrthographicCamera ) {

			that.m_camera.lookAt( that.m_target );

            if ( that.m_last_position.distanceToSquared( that.m_camera.position ) > that.m_EPS 
                || that.m_last_zoom !== that.m_camera.zoom 
            ) {
				that.dispatchEvent( changeEvent );

				that.m_last_position.copy( that.m_camera.position );
				that.m_last_zoom = that.m_camera.zoom;
			}

		} else {
			console.warn( 'THREE.TrackballControls: Unsupported camera type' );
        }
    }
    
    reset(): void {
        const that = this;
		that.m_state = EState.NONE;
		that.m_key_state = EState.NONE;

		that.m_target.copy( that.m_target0 );
		that.m_camera.position.copy( that.m_position0 );
		that.m_camera.up.copy( that.m_up0 );
		that.m_camera.zoom = that.m_zoom0;

		that.m_camera.updateProjectionMatrix();

		that.m_eye.subVectors( that.m_camera.position, that.m_target );

		that.m_camera.lookAt( that.m_target );

		that.dispatchEvent( changeEvent );

		that.m_last_position.copy( that.m_camera.position );
		that.m_last_zoom = that.m_camera.zoom;
    }
    
    keydown(event: KeyboardEvent): void {
        const that = this;
		if ( that.m_enabled === false ) {
            return;
        }

		window.removeEventListener( 'keydown', (ev: KeyboardEvent) => {
            that.keydown(ev);
        } );

		if ( that.m_key_state !== EState.NONE ) {
			return;
		} else if ( event.keyCode === that.m_keys[ EState.ROTATE ] && ! that.m_no_rotate ) {
			that.m_key_state = EState.ROTATE;
		} else if ( event.keyCode === that.m_keys[ EState.ZOOM ] && ! that.m_no_zoom ) {
			that.m_key_state = EState.ZOOM;
		} else if ( event.keyCode === that.m_keys[ EState.PAN ] && ! that.m_no_pan ) {
			that.m_key_state = EState.PAN;
		}
	}
}