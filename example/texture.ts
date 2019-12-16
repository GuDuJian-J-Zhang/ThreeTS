// import * as THREE from "../../three.js/build/three"
import {Scene} from '../src/scene/scene';
import { TrackballControls } from '../src/controller/trackball_controls';
import {THREE} from '../src/3rd';

class TextureExample {
	private m_scene: Scene;
	private m_camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 5 );
    private m_renderer = new THREE.WebGLRenderer();
    private m_controls: TrackballControls;
	private m_cube = undefined;
	constructor(image_file_name: string = "image0.png") {
		let that = this;
		that.m_renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( that.m_renderer.domElement );
		let geometry = new THREE.BoxGeometry( 1, 1, 1 );
        const loader = new THREE.TextureLoader();
        let material = new THREE.MeshBasicMaterial( { 
            map: loader.load(`http://localhost:8000/image/${image_file_name}`)
         } );
		that.m_cube = new THREE.Mesh( geometry, material );
        that.m_scene = new Scene();
        that.m_scene.add( that.m_cube );
        that.m_camera.position.z = 2;
        
        that.m_controls = new TrackballControls(
            that.m_camera, 
            that.m_renderer.domElement
        );
		that.m_controls.rotateSpeed = 5.0;
		that.m_controls.zoomSpeed = 5;
		that.m_controls.panSpeed = 2;
		that.m_controls.noZoom = false;
		that.m_controls.noPan = false;
		that.m_controls.staticMoving = true;
		that.m_controls.dynamicDampingFactor = 0.3;
	}
	
	animate(time: number): void  {
        let that = this;
		requestAnimationFrame( (time: number) => {
			this.animate(time);
        } );

        if (that.resizeRendererToDisplaySize(that.m_renderer)) {
            const canvas = that.m_renderer.domElement;
            that.m_camera.aspect = canvas.clientWidth / canvas.clientHeight;
            that.m_camera.updateProjectionMatrix();
        }

        that.m_controls.update();
        
        time *= 0.001;
        const speed = 0.3;
        const rot = time * speed;
        that.m_cube.rotation.x = rot;
        that.m_cube.rotation.y = rot;

		that.m_renderer.render(that.m_scene, that.m_camera);
    };
    
    private resizeRendererToDisplaySize(renderer: THREE.Renderer): boolean {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          renderer.setSize(width, height, false);
        }
        return needResize;
      }
}

window.onload = function () {
    const res = window.location.href.split("?");
    if (res && res.length > 1) {
        const param = res[1].split("=");
        if (param && param.length > 1) {
            const image_file_name: string = param[1];
            let scene = new TextureExample(image_file_name);
            scene.animate(0);
        }
    } else {
        let scene = new TextureExample();
        scene.animate(0);
    }
    
}