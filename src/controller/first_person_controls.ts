/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
import {THREE}  from '../3rd';

export class FirstPersonControls {
    private m_object: Object; // The camera to be controlled
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

	private m_viewHalfX: number = 0;
	private m_viewHalfY: number = 0;

	// private variable

    constructor(object, domElement) {
        const that = this;
        that.m_object = object;
        that.m_domElement = ( domElement !== undefined ) ? domElement : document;
        if (that.m_domElement instanceof HTMLElement) {
            that.m_domElement.setAttribute( 'tabindex', '-1' );
        }
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

    onMouseDown(event: MouseEvent): void {
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

    
}
