// import * as THREE from "../../three.js/build/three"
/// <reference path = "../typings/scene.d.ts" />
/// <reference path = "../typings/helper.d.ts" />
namespace example {
	export class FogExample {
		private m_scene: scene.Scene;
		private m_camera: THREE.PerspectiveCamera = null;
        private m_renderer = new THREE.WebGLRenderer();
        private m_controls: THREE.FirstPersonControls = null;
		private m_texture: THREE.CanvasTexture = undefined;
		private m_clock = new THREE.Clock();
		constructor() {
            let that = this;
            that.m_camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
            that.m_controls = new THREE.FirstPersonControls( that.m_camera );
            that.m_controls.movementSpeed = 150;
            that.m_controls.lookSpeed = 0.1;

            that.m_scene = new scene.Scene();
            that.m_scene.background = new THREE.Color( 0xefd1b5 );
			that.m_scene.fog = new scene.FogExp2( 0xefd1b5, 0.0025 );

			let worldWidth = 256, worldDepth = 256,
			worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

			let data = that.generateHeight( worldWidth, worldDepth );
			that.m_camera.position.y = data[ worldHalfWidth + worldHalfDepth * worldWidth ] * 10 + 500;
			let geometry = new THREE.PlaneBufferGeometry( 7500, 7500, worldWidth - 1, worldDepth - 1 );
			geometry.rotateX( - Math.PI / 2 );
			let vertices = geometry.attributes.position.array;
			for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
				vertices[ j + 1 ] = data[ i ] * 10;
			}
			that.m_texture = new THREE.CanvasTexture( that.generateTexture( data, worldWidth, worldDepth ) );
			that.m_texture.wrapS = THREE.ClampToEdgeWrapping;
			that.m_texture.wrapT = THREE.ClampToEdgeWrapping;
			let mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { map: that.m_texture } ) );
			that.m_scene.add( mesh );
			that.m_renderer = new THREE.WebGLRenderer();
			that.m_renderer.setPixelRatio( window.devicePixelRatio );
			that.m_renderer.setSize( window.innerWidth, window.innerHeight );
			
			let container = document.getElementById( 'container' );
			container.innerHTML = "";
			container.appendChild( that.m_renderer.domElement );
			
			window.addEventListener( 'resize', that.onWindowResize, false );
		}

		animate() {
			let that = this;
			requestAnimationFrame( () => {
				that.animate();
			} );
			that.render();
		}

		private onWindowResize(): void {
			let that = this;
			that.m_camera.aspect = window.innerWidth / window.innerHeight;
			that.m_camera.updateProjectionMatrix();
			that.m_renderer.setSize( window.innerWidth, window.innerHeight );
			that.m_controls.handleResize();
		}
		
		private generateHeight( width, height ) {
			let size = width * height;
			let data = new Uint8Array( size );
			let perlin: helper.ImprovedNoise = new helper.ImprovedNoise(), quality = 1, z = Math.random() * 100;
			for ( let j = 0; j < 4; j ++ ) {
				for ( let i = 0; i < size; i ++ ) {
					let x = i % width, y = ~~ ( i / width );
					data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 1.75 );
				}
				quality *= 5;
			}
			return data;
		}

		private generateTexture( data, width, height ) {
			let vector3 = new THREE.Vector3( 0, 0, 0 );
			let sun = new THREE.Vector3( 1, 1, 1 );
			sun.normalize();
			let canvas = document.createElement( 'canvas' );
			canvas.width = width;
			canvas.height = height;
			let context = canvas.getContext( '2d' );
			context.fillStyle = '#000';
			context.fillRect( 0, 0, width, height );
			let image = context.getImageData( 0, 0, canvas.width, canvas.height );
			let imageData = image.data;
			for ( let i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {
				vector3.x = data[ j - 2 ] - data[ j + 2 ];
				vector3.y = 2;
				vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
				vector3.normalize();
				let shade = vector3.dot( sun );
				imageData[ i ] = ( 96 + shade * 128 ) * ( 0.5 + data[ j ] * 0.007 );
				imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
				imageData[ i + 2 ] = ( shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
			}
			context.putImageData( image, 0, 0 );
			// Scaled 4x
			let canvasScaled = document.createElement( 'canvas' );
			canvasScaled.width = width * 4;
			canvasScaled.height = height * 4;
			context = canvasScaled.getContext( '2d' );
			context.scale( 4, 4 );
			context.drawImage( canvas, 0, 0 );
			image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );
			imageData = image.data;
			for ( let i = 0, l = imageData.length; i < l; i += 4 ) {
				let v = ~~ ( Math.random() * 5 );
				imageData[ i ] += v;
				imageData[ i + 1 ] += v;
				imageData[ i + 2 ] += v;
			}
			context.putImageData( image, 0, 0 );
			return canvasScaled;
		}
		
		private render(): void {
			let that = this;
			that.m_controls.update( that.m_clock.getDelta() );
			that.m_renderer.render( that.m_scene, that.m_camera );
		}
	}
}