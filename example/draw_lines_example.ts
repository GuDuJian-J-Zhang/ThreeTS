/// <reference path='../typings/mat.d.ts' />
namespace example {
	export class DrawLinesExample {
		private m_scene = new scene.Scene();
		private m_camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 );
		private m_renderer = new THREE.WebGLRenderer();
		private m_lines: THREE.Line = undefined;
		constructor() {
			let that = this;
			that.m_renderer.setSize( window.innerWidth, window.innerHeight );
			document.body.appendChild( that.m_renderer.domElement );
            
            that.m_camera.position.set( 0, 0, 100 );
            that.m_camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

            let line_mat = new material.LineBasicMaterial( { 
				color: 0x0000ff,
				linewidth: 5
			} );
            let geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3( -10, 0, 0) );
            geometry.vertices.push(new THREE.Vector3( 0, 10, 0) );
            geometry.vertices.push(new THREE.Vector3( 10, 0, 0) );
            
            that.m_lines = new THREE.Line( geometry, line_mat );
			that.m_scene.add( that.m_lines );
            
		}
		
		animate(): void  {
			let that = this;
			requestAnimationFrame( () => {
				this.animate();
			} );
	
			that.m_renderer.render(that.m_scene, that.m_camera);
		};
	}
}