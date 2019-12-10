
import {Scene} from '../src/scene/scene';
import {NrrdLoader} from '../src/loaders/nrrd_loader';
import {THREE} from '../src/3rd';
import { Volume } from '../src/volume/volume';
import { VolumeRenderShader1 } from '../src/shader/volume_render_shader1';
import { TrackballControls } from '../src/controller/trackball_controls';
class NrrdLoaderExample {
	private m_scene: Scene;
	private m_camera: THREE.PerspectiveCamera;
    private m_renderer: THREE.WebGLRenderer;
    private m_controls: TrackballControls;
	constructor(nrrd_file_name: string = "test.nrrd") {
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
        that.loadData(nrrd_file_name);
        
        // Create renderer
		const canvas = document.createElement( 'canvas' );
		const context = canvas.getContext( 'webgl2', { alpha: false, antialias: false } );
        that.m_renderer = new THREE.WebGLRenderer( { canvas: canvas, context: context } );
            
        // that.m_renderer = new THREE.WebGLRenderer( { alpha: true } );
        that.m_renderer.setClearColor("#a7a7a2");
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
        
        that.m_controls.update();

		that.m_renderer.render(that.m_scene, that.m_camera);
    };
    
    private loadData(nrrd_file_name: string): void {
        const that = this;
        var loader = new NrrdLoader();
		loader.load( `http://localhost:8000/nrrd/${nrrd_file_name}`, (volume: Volume): void => {
            // Texture to hold the volume. We have scalars, so we put our data in the red channel.
			// THREEJS will select R32F (33326) based on the THREE.RedFormat and THREE.FloatType.
			// Also see https://www.khronos.org/registry/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
			// TODO: look the dtype up in the volume metadata
            const volume_xyz: THREE.Vector3 = volume.xyzLength();
            let texture_3d = new THREE.DataTexture3D( 
                volume.data, 
                volume_xyz.x, 
                volume_xyz.y, 
                volume_xyz.z 
            );
			texture_3d.format = THREE.RedFormat;
			texture_3d.type = THREE.FloatType;
			texture_3d.minFilter = texture_3d.magFilter = THREE.LinearFilter;
			texture_3d.unpackAlignment = 1;

			// Colormap textures
			const cmtextures = {
				viridis: new THREE.TextureLoader().load( 'http://localhost:8000/textures/cm_viridis.png', () => {
                    that.animate();
                } ),
				gray: new THREE.TextureLoader().load( 'http://localhost:8000/textures/cm_gray.png', () => {
                    that.animate();
                } )
			};

			// Material
			var shader = VolumeRenderShader1;

			let uniforms = THREE.UniformsUtils.clone( shader.uniforms );

			uniforms[ "u_data" ].value = texture_3d;
			uniforms[ "u_size" ].value.set( 
                volume_xyz.x, 
                volume_xyz.y, 
                volume_xyz.z 
            );
			uniforms[ "u_clim" ].value.set( 0, 1);
			uniforms[ "u_renderstyle" ].value = 0; // 0: MIP, 1: ISO
			uniforms[ "u_renderthreshold" ].value = 0.15; // For ISO renderstyle
			uniforms[ "u_cmdata" ].value = cmtextures.viridis;

			const material = new THREE.ShaderMaterial( {
				uniforms: uniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader,
				side: THREE.BackSide // The volume shader uses the backface as its "reference point"
			} );

            // THREE.Mesh
            const geometry = new THREE.BoxBufferGeometry( 
                volume_xyz.x, 
                volume_xyz.y, 
                volume_xyz.z
            );
			geometry.translate( 
                volume_xyz.x / 2 - 0.5, 
                volume_xyz.y / 2 - 0.5, 
                volume_xyz.y / 2 - 0.5 
            );

            var mesh = new THREE.Mesh( geometry, material );
            that.m_scene.add(mesh);
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
    const res = window.location.href.split("?");
    if (res && res.length > 1) {
        const param = res[1].split("=");
        if (param && param.length > 1) {
            const nrrd_file_name: string = param[1];
            let nrrd_loader_example = new NrrdLoaderExample(nrrd_file_name);
            nrrd_loader_example.animate();
        }
    } else {
        let nrrd_loader_example = new NrrdLoaderExample();
        nrrd_loader_example.animate();
    }
    
}