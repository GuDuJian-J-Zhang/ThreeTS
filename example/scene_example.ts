// import * as THREE from "../../three.js/build/three"
import {Scene} from '../src/scene/scene';
import {THREE} from '../src/3rd';

class SceneExample {
	private m_scene = new Scene();
	private m_camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
	private m_renderer = new THREE.WebGLRenderer();
	private m_cube = undefined;
	constructor() {
		let that = this;
		that.m_renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( that.m_renderer.domElement );
		let geometry = new THREE.BoxGeometry( 1, 1, 5 );
		let material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		that.m_cube = new THREE.Mesh( geometry, material );
		that.m_scene.add( that.m_cube );
		that.m_camera.position.z = 5;
	}
	
	animate(): void  {
		let that = this;
		requestAnimationFrame( () => {
			this.animate();
		} );

		that.m_cube.rotation.x += 0.1;
		that.m_cube.rotation.y += 0.1;

		that.m_renderer.render(that.m_scene, that.m_camera);
	};
}

window.onload = function () {
    let scene = new SceneExample();
    scene.animate();
}