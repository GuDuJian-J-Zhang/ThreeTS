
import {Scene} from '../src/scene/scene';
import {NrrdLoader, ENrrdDataArrayType} from '../src/loaders/nrrd_loader';
import {THREE} from '../src/3rd';
import { Volume } from '../src/volume/volume';
import { VolumeRenderShader1 } from '../src/shader/volume_render_shader1';
import { TrackballControls } from '../src/controller/trackball_controls';
import {glMatrix} from '../src/3rd';
const cubeStrip = [
    1, 1, 0,
	0, 1, 0,
	1, 1, 1,
	0, 1, 1,
	0, 0, 1,
	0, 1, 0,
	0, 0, 0,
	1, 1, 0,
	1, 0, 0,
	1, 1, 1,
	1, 0, 1,
	0, 0, 1,
	1, 0, 0,
	0, 0, 0
];

const vertShader =
`#version 300 es
#line 4
layout(location=0) in vec3 pos;
uniform mat4 proj_view;
uniform vec3 eye_pos;
uniform vec3 volume_scale;

out vec3 vray_dir;
flat out vec3 transformed_eye;

void main(void) {
	// TODO: For non-uniform size volumes we need to transform them differently as well
	// to center them properly
	vec3 volume_translation = vec3(0.5) - volume_scale * 0.5;
	gl_Position = proj_view * vec4(pos * volume_scale + volume_translation, 1);
	transformed_eye = (eye_pos - volume_translation) / volume_scale;
	vray_dir = pos - transformed_eye;
}`;

const fragShader =
`#version 300 es
#line 24
precision highp int;
precision highp float;
uniform highp sampler3D volume;
// uniform highp sampler2D colormap;
uniform ivec3 volume_dims;
uniform float dt_scale;

in vec3 vray_dir;
flat in vec3 transformed_eye;
out vec4 color;

vec2 intersect_box(vec3 orig, vec3 dir) {
	const vec3 box_min = vec3(0);
	const vec3 box_max = vec3(1);
	vec3 inv_dir = 1.0 / dir;
	vec3 tmin_tmp = (box_min - orig) * inv_dir;
	vec3 tmax_tmp = (box_max - orig) * inv_dir;
	vec3 tmin = min(tmin_tmp, tmax_tmp);
	vec3 tmax = max(tmin_tmp, tmax_tmp);
	float t0 = max(tmin.x, max(tmin.y, tmin.z));
	float t1 = min(tmax.x, min(tmax.y, tmax.z));
	return vec2(t0, t1);
}

// Pseudo-random number gen from
// http://www.reedbeta.com/blog/quick-and-easy-gpu-random-numbers-in-d3d11/
// with some tweaks for the range of values
float wang_hash(int seed) {
	seed = (seed ^ 61) ^ (seed >> 16);
	seed *= 9;
	seed = seed ^ (seed >> 4);
	seed *= 0x27d4eb2d;
	seed = seed ^ (seed >> 15);
	return float(seed % 2147483647) / float(2147483647);
}

float linear_to_srgb(float x) {
	if (x <= 0.0031308f) {
		return 12.92f * x;
	}
	return 1.055f * pow(x, 1.f / 2.4f) - 0.055f;
}

vec3 colormapJet(float x) {
	vec3 result;
	result.r = x < 0.89 ? ((x - 0.35) / 0.31) : (1.0 - (x - 0.89) / 0.11 * 0.5);
	result.g = x < 0.64 ? ((x - 0.125) * 4.0) : (1.0 - (x - 0.64) / 0.27);
	result.b = x < 0.34 ? (0.5 + x * 0.5 / 0.11) : (1.0 - (x - 0.34) / 0.31);
	return clamp(result, 0.0, 1.0);
}

void main(void) {
	vec3 ray_dir = normalize(vray_dir);
	vec2 t_hit = intersect_box(transformed_eye, ray_dir);
	if (t_hit.x > t_hit.y) {
		discard;
	}
	t_hit.x = max(t_hit.x, 0.0);
	vec3 dt_vec = 1.0 / (vec3(volume_dims) * abs(ray_dir));
	float dt = dt_scale * min(dt_vec.x, min(dt_vec.y, dt_vec.z));
	float offset = wang_hash(int(gl_FragCoord.x + 640.0 * gl_FragCoord.y));
	vec3 p = transformed_eye + (t_hit.x + offset * dt) * ray_dir;
	for (float t = t_hit.x; t < t_hit.y; t += dt) {
		float val = texture(volume, p).r;
		vec4 val_color = vec4(colormapJet(val), val);
		// Opacity correction
		val_color.a = 1.0 - pow(1.0 - val_color.a, dt_scale);
		color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
		color.a += (1.0 - color.a) * val_color.a;
		if (color.a >= 0.95) {
			break;
		}
		p += ray_dir * dt;
	}
    color.r = linear_to_srgb(color.r);
    color.g = linear_to_srgb(color.g);
    color.b = linear_to_srgb(color.b);
}`;

const defaultEye = glMatrix.vec3.set(glMatrix.vec3.create(), 0.5, 0.5, 1.5);
const center = glMatrix.vec3.set(glMatrix.vec3.create(), 0.5, 0.5, 0.5);
const up = glMatrix.vec3.set(glMatrix.vec3.create(), 0.0, 1.0, 0.0);

class NrrdLoaderExample {
    private m_canvas: HTMLCanvasElement;
    private m_gl: WebGL2RenderingContext;
    private m_proj_mat: glMatrix.mat4;
    private m_shader: WebGLProgram;
    private m_uniforms: {} = {};
    private m_renderer: THREE.WebGLRenderer;
    private m_controls: TrackballControls;
	constructor(nrrd_file_name: string = "test.nrrd") {
		let that = this;
		// that.m_renderer.setSize( window.innerWidth, window.innerHeight );
		// document.body.appendChild( that.m_renderer.domElement );
        
        that.m_canvas = <HTMLCanvasElement>document.getElementById("glcanvas");
	    that.m_gl = that.m_canvas.getContext("webgl2");
	    if (!that.m_gl) {
	    	alert("Unable to initialize WebGL2. Your browser may not support it");
	    	return;
	    }
	    const WIDTH: number = Number(that.m_canvas.getAttribute("width"));
	    const HEIGHT: number = Number(that.m_canvas.getAttribute("height"));
    
	    that.m_proj_mat = glMatrix.mat4.perspective(
	    	glMatrix.mat4.create(), 
	    	60 * Math.PI / 180.0,
	    	WIDTH / HEIGHT, 
	    	0.1, 100
	    );
    
	    let camera = new ArcballCamera(defaultEye, center, up, 2, [WIDTH, HEIGHT]);
	    const projView = glMatrix.mat4.create();
    
	    // Register mouse and touch listeners
	    var controller = new Controller();
	    controller.mousemove = function(prev, cur, evt) {
	    	if (evt.buttons == 1) {
	    		camera.rotate(prev, cur);
    
	    	} else if (evt.buttons == 2) {
	    		camera.pan([cur[0] - prev[0], prev[1] - cur[1]]);
	    	}
	    };
	    controller.wheel = function(amt) { camera.zoom(amt); };
	    controller.pinch = controller.wheel;
	    controller.twoFingerDrag = function(drag) { camera.pan(drag); };
    
	    // document.addEventListener("keydown", function(evt) {
	    // 	if (evt.key == "p") {
	    // 		takeScreenShot = true;
	    // 	}
	    // });
    
	    controller.registerForCanvas(that.m_canvas);
    
	    // Setup VAO and VBO to render the cube to run the raymarching shader
	    var vao =  that.m_gl.createVertexArray();
        that.m_gl.bindVertexArray(vao);
    
	    var vbo = that.m_gl.createBuffer();
        that.m_gl.bindBuffer( that.m_gl.ARRAY_BUFFER, vbo);
	    that.m_gl.bufferData( that.m_gl.ARRAY_BUFFER, new Float32Array(cubeStrip), that.m_gl.STATIC_DRAW);
    
	    that.m_gl.enableVertexAttribArray(0);
	    that.m_gl.vertexAttribPointer(0, 3, that.m_gl.FLOAT, false, 0, 0);
    
	    that.createShader(that.m_gl, vertShader, fragShader);
	    that.m_gl.useProgram(that.m_shader);
    
	    that.m_gl.uniform1i(that.m_uniforms["volume"], 0);
	    that.m_gl.uniform1i(that.m_uniforms["colormap"], 1);
	    that.m_gl.uniform1f(that.m_uniforms["dt_scale"], 1.0);
    
	    // Setup required OpenGL state for drawing the back faces and
	    // composting with the background color
	    that.m_gl.enable(that.m_gl.CULL_FACE);
	    that.m_gl.cullFace(that.m_gl.FRONT);
	    that.m_gl.enable(that.m_gl.BLEND);
	    that.m_gl.blendFunc(that.m_gl.ONE, that.m_gl.ONE_MINUS_SRC_ALPHA);
    
	    // See if we were linked to a datset
	    // if (window.location.hash) {
	    // 	var linkedDataset = decodeURI(window.location.hash.substr(1));
	    // 	if (linkedDataset in volumes) {
	    // 		document.getElementById("volumeList").value = linkedDataset;
	    // 	}
	    // }
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
            const volume_data_type: ENrrdDataArrayType = volume.getDataType();
            let texture_type: THREE.TextureDataType;
            let float32data: THREE.TypedArray;
            if (volume_data_type === ENrrdDataArrayType.UINT8) {
                texture_type = THREE.UnsignedByteType;
                float32data = volume.data;
            } else if (volume_data_type === ENrrdDataArrayType.FLOAT) {
                texture_type = THREE.FloatType;
                float32data = volume.data;
            } else if (volume_data_type === ENrrdDataArrayType.SHORT) {
                texture_type = THREE.FloatType;
                float32data = new Float32Array(volume.data.length);
                for(let i = 0; i < volume.data.length; i++) {
                    float32data[i] = volume.data[i] / (volume.data[i] >= 0 ? 32767 : 32768);
                }
            } else if (volume_data_type === ENrrdDataArrayType.UINT16) {
                texture_type = THREE.FloatType;
                float32data = new Float32Array(volume.data.length);
                for(let i = 0; i < volume.data.length; i++) {
                    const idata = volume.data[i];
                    float32data[i] = (idata >= 0x8000) ? -(0x10000 - idata) / 0x8000 : idata / 0x7FFF;
                }
            }

            const volume_xyz: THREE.Vector3 = volume.xyzLength();
            let texture_3d = new THREE.DataTexture3D( 
                float32data, 
                volume_xyz.x, 
                volume_xyz.y, 
                volume_xyz.z 
            );
            texture_3d.format = THREE.RedFormat;
			texture_3d.type = texture_type;
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
			uniforms[ "u_renderstyle" ].value = 1; // 0: MIP, 1: ISO
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

    private compileShader(
        gl: WebGL2RenderingContext, 
        vert: string, frag: string
    ): WebGLProgram {
        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vert);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)){
            alert("Vertex shader failed to compile, see console for log");
            console.log(gl.getShaderInfoLog(vs));
            return null;
        }
    
        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, frag);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)){
            alert("Fragment shader failed to compile, see console for log");
            console.log(gl.getShaderInfoLog(fs));
            return null;
        }
    
        var program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
            alert("Shader failed to link, see console for log");
            console.log(gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    private createShader(
        gl: WebGLRenderingContext, 
        vertexSrc: string, fragmentSrc: string
    ) {
        const that = this;
        that.m_shader = that.compileShader(that.m_gl, vertexSrc, fragmentSrc);
    
        var regexUniform = /uniform[^;]+[ ](\w+);/g
        var matchUniformName = /uniform[^;]+[ ](\w+);/
    
        const vertexUnifs = vertexSrc.match(regexUniform);
        const fragUnifs = fragmentSrc.match(regexUniform);
    
        if (vertexUnifs) {
            vertexUnifs.forEach(function(unif) {
                var m = unif.match(matchUniformName);
                that.m_uniforms[m[1]] = -1;
            });
        }
        if (fragUnifs) {
            fragUnifs.forEach(function(unif) {
                const m = unif.match(matchUniformName);
                that.m_uniforms[m[1]] = -1;
            });
        }
    
        for (let unif in that.m_uniforms) {
            that.m_uniforms[unif] = gl.getUniformLocation(that.m_shader, unif);
        }
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