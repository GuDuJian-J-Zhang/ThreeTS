/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
import {THREE}  from '../3rd';

export class FirstPersonControls {
    private m_camera: THREE.Camera; // The camera to be controlled
    private m_domElement: HTMLElement | Document; // The HTML element used for event listeners
    private m_enabled: boolean = true;
    private m_movementSpeed: number = 1.0;
    private m_lookSpeed: number = 0.005;
    private m_lookVertical: boolean = true;
    private m_autoForward: boolean = false;

	private m_activeLook: boolean = true;

	private m_heightSpeed: boolean = false;
	private m_heightCoef: number = 1.0;
	private m_heightMin: number = 0.0;
	private m_heightMax: number = 1.0;

	private m_constrainVertical: boolean = false;
	private m_verticalMin: number = 0;
	private m_verticalMax: number = Math.PI;

	private m_mouseDragOn: boolean = false;

	// internals

	private m_autoSpeedFactor: number = 0.0;

	private m_mouseX: number = 0;
	private m_mouseY: number = 0;

	private m_moveForward: boolean = false;
	private m_moveBackward: boolean = false;
	private m_moveLeft: boolean = false;
    private m_moveRight: boolean = false;
    private m_moveUp: boolean = false;
    private m_moveDown: boolean = false;

	private m_viewHalfX: number = 0;
	private m_viewHalfY: number = 0;

    // private variable
    private m_lat: number = 0;
    private m_lon: number = 0;

    constructor(object, domElement?) {
        const that = this;
        that.m_camera = object;
        that.m_domElement = ( domElement !== undefined ) ? domElement : document;
        if (that.m_domElement instanceof HTMLElement) {
            that.m_domElement.setAttribute( 'tabindex', '-1' );
        }

        that.initialize();
    }

    private initialize(): void {
        const that = this;
        const _onMouseMove = (event: MouseEvent) => {
            that.onMouseMove(event);
        };
	    const _onMouseDown = (event: MouseEvent) => {
            that.onMouseDown(event);
        };
	    const _onMouseUp = (event: MouseEvent) => {
            that.onMouseUp(event);
        }
	    const _onKeyDown = (event: KeyboardEvent) => {
            that.onKeyDown(event);
        };
	    const _onKeyUp = (event: KeyboardEvent) => {
            that.onKeyUp(event);
        };
    
	    that.m_domElement.addEventListener( 'contextmenu', that.contextmenu, false );
	    that.m_domElement.addEventListener( 'mousemove', _onMouseMove, false );
	    that.m_domElement.addEventListener( 'mousedown', _onMouseDown, false );
	    that.m_domElement.addEventListener( 'mouseup', _onMouseUp, false );
    
	    window.addEventListener( 'keydown', _onKeyDown, false );
	    window.addEventListener( 'keyup', _onKeyUp, false );
    
	    that.handleResize();
	    that.setOrientation();
    }

    lookAt(x: THREE.Vector3 | number, y: number, z: number): FirstPersonControls {
        const that = this;
        let target: THREE.Vector3 = new THREE.Vector3();
		if ( x instanceof THREE.Vector3) {

			target.copy( x );

		} else {
			target.set( x, y, z );
		}

		that.m_camera.lookAt( target );

		that.setOrientation();

		return that;
    }
    
    update(delta: number): void {
        const that = this;

		if (that.m_enabled === false) {
            return;
        }

		if (that.m_heightSpeed ) {

			const y = THREE.Math.clamp( that.m_camera.position.y, that.m_heightMin, that.m_heightMax );
			const heightDelta = y - that.m_heightMin;

			that.m_autoSpeedFactor = delta * ( heightDelta * that.m_heightCoef );
		} else {
			that.m_autoSpeedFactor = 0.0;
		}

		const actualMoveSpeed = delta * that.m_movementSpeed;

		if (that.m_moveForward || (that.m_autoForward && ! that.m_moveBackward)) {
            that.m_camera.translateZ( - (actualMoveSpeed + that.m_autoSpeedFactor));
        }
		if (that.m_moveBackward) {
            that.m_camera.translateZ( actualMoveSpeed );
        }

		if ( that.m_moveLeft ) {
            that.m_camera.translateX( - actualMoveSpeed );
        }
		if ( that.m_moveRight ) {
            that.m_camera.translateX( actualMoveSpeed );
        }

		if ( that.m_moveUp ) {
            that.m_camera.translateY( actualMoveSpeed );
        }
		if ( that.m_moveDown ) {
            that.m_camera.translateY( - actualMoveSpeed );
        }

		let actualLookSpeed = delta * that.m_lookSpeed;

		if ( !that.m_activeLook ) {
			actualLookSpeed = 0;
		}

		let verticalLookRatio = 1;

		if (that.m_constrainVertical ) {
			verticalLookRatio = Math.PI / ( that.m_verticalMax - that.m_verticalMin );
		}

		that.m_lon -= that.m_mouseX * actualLookSpeed;
		if ( that.m_lookVertical ) {
            that.m_lat -= that.m_mouseY * actualLookSpeed * verticalLookRatio;
        }

		that.m_lat = Math.max( - 85, Math.min( 85, that.m_lat ) );

		let phi = THREE.Math.degToRad( 90 - that.m_lat );
		const theta = THREE.Math.degToRad( that.m_lon );

		if ( that.m_constrainVertical ) {
			phi = THREE.Math.mapLinear( phi, 0, Math.PI, that.m_verticalMin, that.m_verticalMax );
		}

		const position = that.m_camera.position;

        let target_position: THREE.Vector3 = new THREE.Vector3();
		target_position.setFromSphericalCoords( 1, phi, theta ).add( position );

		that.m_camera.lookAt( target_position );

    }
    
    dispose(): void {
        const that = this;
		that.m_domElement.removeEventListener( 'contextmenu', that.contextmenu, false );
		// that.m_domElement.removeEventListener( 'mousedown', _onMouseDown, false );
		// that.m_domElement.removeEventListener( 'mousemove', _onMouseMove, false );
		// that.m_domElement.removeEventListener( 'mouseup', _onMouseUp, false );

		// window.removeEventListener( 'keydown', _onKeyDown, false );
		// window.removeEventListener( 'keyup', _onKeyUp, false );

    }

    handleResize(): void {
        const that = this;
        if (that.m_domElement === document) {
            that.m_viewHalfX = window.innerWidth / 2.0;
            that.m_viewHalfY = window.innerHeight / 2.0
        } else {
            that.m_viewHalfX = (<HTMLElement>that.m_domElement).offsetWidth / 2.0;
            that.m_viewHalfY = (<HTMLElement>that.m_domElement).offsetHeight / 2.0;
        }
    }

    private onMouseDown(event: MouseEvent): void {
        const that = this;
        if (that.m_domElement instanceof HTMLElement) {
            that.m_domElement.focus();
        }
        event.preventDefault();
        event.stopPropagation();

        if (that.m_activeLook) {
            switch (event.button) {
                case 0:
                    that.m_moveForward = true;
                    break;
                case 2:
                    that.m_moveBackward = true;
                    break;
            }
        }

        that.m_mouseDragOn = true;
    }

    private onMouseUp(event: MouseEvent): void {
        const that = this;

		event.preventDefault();
		event.stopPropagation();

		if ( that.m_activeLook ) {
			switch ( event.button ) {
                case 0: 
                    that.m_moveForward = false; 
                    break;
                case 2: 
                    that.m_moveBackward = false; 
                    break;
			}
		}
		that.m_mouseDragOn = false;
    }
    
    private onMouseMove(event: MouseEvent): void {
        const that = this;
		if ( that.m_domElement === document ) {
			that.m_mouseX = event.pageX - that.m_viewHalfX;
			that.m_mouseY = event.pageY - that.m_viewHalfY;
		} else {
			that.m_mouseX = event.pageX - (<HTMLElement>that.m_domElement).offsetLeft - that.m_viewHalfX;
			that.m_mouseY = event.pageY - (<HTMLElement>that.m_domElement).offsetTop - that.m_viewHalfY;
		}
    }

    private onKeyDown(event: KeyboardEvent): void {
        const that = this;
		//event.preventDefault();

		switch ( event.keyCode ) {

			case 38: /*up*/
            case 87: /*W*/ 
                that.m_moveForward = true; 
                break;

			case 37: /*left*/
            case 65: /*A*/ 
                that.m_moveLeft = true; 
                break;

			case 40: /*down*/
            case 83: /*S*/ 
                that.m_moveBackward = true; 
                break;

			case 39: /*right*/
            case 68: /*D*/ 
                that.m_moveRight = true; 
                break;

            case 82: /*R*/ 
                that.m_moveUp = true; 
                break;
            case 70: /*F*/ 
                that.m_moveDown = true; 
                break;
		}
	};

	private onKeyUp(event: KeyboardEvent): void {
        const that = this;

		switch ( event.keyCode ) {

			case 38: /*up*/
            case 87: /*W*/ 
                that.m_moveForward = false; 
                break;

			case 37: /*left*/
            case 65: /*A*/ 
                that.m_moveLeft = false; 
                break;

			case 40: /*down*/
            case 83: /*S*/ 
                that.m_moveBackward = false; 
                break;

			case 39: /*right*/
            case 68: /*D*/ 
                that.m_moveRight = false; 
                break;

            case 82: /*R*/ 
                that.m_moveUp = false; 
                break;
            case 70: /*F*/ 
                that.m_moveDown = false; 
                break;
		}
	}
    
    private contextmenu(event: MouseEvent): void {
		event.preventDefault();
    }
    
    private setOrientation(): void{
        const that = this;
		const quaternion: THREE.Quaternion = that.m_camera.quaternion;

        let look_direction: THREE.Vector3 = new THREE.Vector3();
        look_direction.set( 0, 0, - 1 ).applyQuaternion( quaternion );
        
        let spherical: THREE.Spherical = new THREE.Spherical();
		spherical.setFromVector3( look_direction );

		that.m_lat = 90 - THREE.Math.radToDeg( spherical.phi );
		that.m_lon = THREE.Math.radToDeg( spherical.theta );
	}

    set movementSpeed(value: number) {
        const that = this;
        that.m_movementSpeed = value;
    }

    set lookSpeed(value: number) {
        const that = this;
        that.m_lookSpeed = value;
    }

    
}
