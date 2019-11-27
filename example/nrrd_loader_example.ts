
import {Scene} from '../src/scene/scene';
import {NrrdLoader} from '../src/loaders/nrrd_loader';
import {THREE} from '../src/3rd';
import { Volume, EVolumeAxis } from '../src/volume/volume';
import { VolumeSlice } from '../src/volume/volume_slice';
import { TrackballControls } from '../src/controller/trackball_controls';
class NrrdLoaderExample {
	private m_scene: Scene;
	private m_camera: THREE.PerspectiveCamera;
    private m_renderer: THREE.WebGLRenderer;
    private m_controls: TrackballControls;
	constructor() {
		let that = this;
		// that.m_renderer.setSize( window.innerWidth, window.innerHeight );
		// document.body.appendChild( that.m_renderer.domElement );
        
        that.m_camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 1e10 );
		that.m_camera.position.set( 0, 0, 100 );
        
        that.m_scene = new Scene();
        that.m_scene.add(that.m_camera);

        let dirLight = new THREE.DirectionalLight( 0xffffff );
		dirLight.position.set( 200, 200, 1000 ).normalize();
		that.m_camera.add( dirLight );
        that.m_camera.add( dirLight.target );
        that.loadData();
        
        that.m_renderer = new THREE.WebGLRenderer( { alpha: true } );
		that.m_renderer.setPixelRatio( window.devicePixelRatio );
		that.m_renderer.setSize( window.innerWidth, window.innerHeight );
        
        // document.body.appendChild(that.m_renderer.domElement);
        
        let container = document.createElement( 'div' );
		document.body.appendChild( container );
		container.appendChild(that.m_renderer.domElement );
        
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
		
		window.addEventListener( 'resize', () => {
            that.onWindowResize();
        }, false );
	}
	
	animate(): void  {
		let that = this;
		requestAnimationFrame( () => {
			this.animate();
		} );

		that.m_renderer.render(that.m_scene, that.m_camera);
    };
    
    private loadData(): void {
        const that = this;
        var loader = new NrrdLoader();
		loader.load( "http://localhost:8000/nrrd/test.nrrd", (volume: Volume): void => {
            const volume_xyz: THREE.Vector3 = volume.xyzLength();
		    //box helper to see the extend of the volume
		    const geometry = new THREE.BoxBufferGeometry( 
                volume_xyz.x, 
                volume_xyz.y, 
                volume_xyz.z
            );
		    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		    const cube = new THREE.Mesh( geometry, material );
		    cube.visible = false;
		    const box = new THREE.BoxHelper(cube);
            that.m_scene.add(box);
            const volume_matrix: THREE.Matrix4 = volume.matrix();
		    box.applyMatrix(volume_matrix);
            that.m_scene.add(cube);
            
            const ras_dimension: number[] = volume.rasDimensions();
            //z plane
		    // const sliceZ: VolumeSlice = volume.extractSlice(EVolumeAxis.Z, Math.floor( ras_dimension[ 2 ] / 4 ) );
            // const slice_z_mesh: THREE.Mesh = sliceZ.mesh();
            // that.m_scene.add(slice_z_mesh);
		    //y plane
		    const sliceY: VolumeSlice = volume.extractSlice(EVolumeAxis.Y, Math.floor( ras_dimension[ 1 ] / 2 ) );
            const slice_y_mesh: THREE.Mesh = sliceY.mesh();
            that.m_scene.add(slice_y_mesh);
		    //x plane
		    // const sliceX: VolumeSlice = volume.extractSlice(EVolumeAxis.X, Math.floor( ras_dimension[ 0 ] / 2 ) );
            // const slice_x_mesh: THREE.Mesh = sliceX.mesh();
            // that.m_scene.add(slice_x_mesh);
	    } );
    }

    private onWindowResize(): void {
        const that = this;
        that.m_camera.aspect = window.innerWidth / window.innerHeight;
        that.m_camera.updateProjectionMatrix();
        that.m_renderer.setSize( window.innerWidth, window.innerHeight );
        that.m_controls.handleResize();
    }
}

window.onload = function () {
    let nrrd_loader_example = new NrrdLoaderExample();
    nrrd_loader_example.animate();
}