/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
import {glMatrix} from '../../src/3rd';

export class ArcballCamera {
    private m_zoomSpeed: number;
    private m_invScreen: number[] = [];
    private m_centerTranslation: glMatrix.mat4;
    private m_translation: glMatrix.mat4;
    private m_rotation: glMatrix.quat;
    private m_camera: glMatrix.mat4;
    private m_invCamera: glMatrix.mat4;
    constructor(
        eye: glMatrix.vec3, 
        center: glMatrix.vec3, 
        up: glMatrix.vec3, 
        zoomSpeed: number, 
        screenDims: number[]
    ) {
        var veye = glMatrix.vec3.set(glMatrix.vec3.create(), eye[0], eye[1], eye[2]);
        var vcenter = glMatrix.vec3.set(glMatrix.vec3.create(), center[0], center[1], center[2]);
        var vup = glMatrix.vec3.set(glMatrix.vec3.create(), up[0], up[1], up[2]);
        glMatrix.vec3.normalize(vup, vup);
    
        var zAxis = glMatrix.vec3.sub(glMatrix.vec3.create(), vcenter, veye);
        var viewDist = glMatrix.vec3.len(zAxis);
        glMatrix.vec3.normalize(zAxis, zAxis);
    
        var xAxis = glMatrix.vec3.cross(glMatrix.vec3.create(), zAxis, vup);
        glMatrix.vec3.normalize(xAxis, xAxis);
    
        var yAxis = glMatrix.vec3.cross(glMatrix.vec3.create(), xAxis, zAxis);
        glMatrix.vec3.normalize(yAxis, yAxis);
    
        glMatrix.vec3.cross(xAxis, zAxis, yAxis);
        glMatrix.vec3.normalize(xAxis, xAxis);
    
        this.m_zoomSpeed = zoomSpeed;
        this.m_invScreen = [1.0 / screenDims[0], 1.0 / screenDims[1]];
    
        this.m_centerTranslation = glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), center);
        glMatrix.mat4.invert(this.m_centerTranslation, this.m_centerTranslation);
    
        const vt = glMatrix.vec3.set(glMatrix.vec3.create(), 0, 0, -1.0 * viewDist);
        this.m_translation = glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), vt);
    
        const rotMat = glMatrix.mat3.fromValues(xAxis[0], xAxis[1], xAxis[2],
            yAxis[0], yAxis[1], yAxis[2],
            -zAxis[0], -zAxis[1], -zAxis[2]);
        glMatrix.mat3.transpose(rotMat, rotMat);
        this.m_rotation = glMatrix.quat.fromMat3(glMatrix.quat.create(), rotMat);
        glMatrix.quat.normalize(this.m_rotation, this.m_rotation);
    
        this.m_camera = glMatrix.mat4.create();
        this.m_invCamera = glMatrix.mat4.create();
        this.updateCameraMatrix();
    }

    getCamera(): glMatrix.mat4 {
        const that = this;
        return that.m_camera;
    }

    rotate(prevMouse: number[], curMouse): void {
        const mPrev = glMatrix.vec2.set(glMatrix.vec2.create(),
        this.clamp(prevMouse[0] * 2.0 * this.m_invScreen[0] - 1.0, -1.0, 1.0),
        this.clamp(1.0 - prevMouse[1] * 2.0 * this.m_invScreen[1], -1.0, 1.0));

        const mCur = glMatrix.vec2.set(glMatrix.vec2.create(),
        this.clamp(curMouse[0] * 2.0 * this.m_invScreen[0] - 1.0, -1.0, 1.0),
        this.clamp(1.0 - curMouse[1] * 2.0 * this.m_invScreen[1], -1.0, 1.0));

        const mPrevBall = this.screenToArcball(mPrev);
        const mCurBall = this.screenToArcball(mCur);
        // rotation = curBall * prevBall * rotation
        this.m_rotation = glMatrix.quat.mul(this.m_rotation, mPrevBall, this.m_rotation);
        this.m_rotation = glMatrix.quat.mul(this.m_rotation, mCurBall, this.m_rotation);
    
        this.updateCameraMatrix();
    }

    zoom(amount: number): void {
        const vt = glMatrix.vec3.set(glMatrix.vec3.create(), 0.0, 0.0, amount * this.m_invScreen[1] * this.m_zoomSpeed);
        const t = glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), vt);
        this.m_translation = glMatrix.mat4.mul(this.m_translation, t, this.m_translation);
        if (this.m_translation[14] >= -0.2) {
            this.m_translation[14] = -0.2;
        }
        this.updateCameraMatrix();
    }

    pan(mouseDelta: number[]): void {
        const delta = glMatrix.vec4.set(glMatrix.vec4.create(), mouseDelta[0] * this.m_invScreen[0] * Math.abs(this.m_translation[14]),
            mouseDelta[1] * this.m_invScreen[1] * Math.abs(this.m_translation[14]), 0, 0);
        const worldDelta = glMatrix.vec4.transformMat4(glMatrix.vec4.create(), delta, this.m_invCamera);
        const translation = glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [worldDelta[0], worldDelta[1], worldDelta[2]]);
        this.m_centerTranslation = glMatrix.mat4.mul(this.m_centerTranslation, translation, this.m_centerTranslation);
        this.updateCameraMatrix();
    }

    eyePos(): number[] {
        const that = this;
        return [
            that.m_invCamera[12], 
            that.m_invCamera[13], 
            that.m_invCamera[14]
        ];
    }
    
    eyeDir(): number[] {
        let dir = glMatrix.vec4.set(glMatrix.vec4.create(), 0.0, 0.0, -1.0, 0.0);
        dir = glMatrix.vec4.transformMat4(dir, dir, this.m_invCamera);
        dir = glMatrix.vec4.normalize(dir, dir);
        return [dir[0], dir[1], dir[2]];
    }
    
    upDir(): number[] {
        let dir = glMatrix.vec4.set(glMatrix.vec4.create(), 0.0, 1.0, 0.0, 0.0);
        dir = glMatrix.vec4.transformMat4(dir, dir, this.m_invCamera);
        dir = glMatrix.vec4.normalize(dir, dir);
        return [dir[0], dir[1], dir[2]];
    }

    private updateCameraMatrix(): void {
        // camera = translation * rotation * centerTranslation
        var rotMat = glMatrix.mat4.fromQuat(glMatrix.mat4.create(), this.m_rotation);
        this.m_camera = glMatrix.mat4.mul(this.m_camera, rotMat, this.m_centerTranslation);
        this.m_camera = glMatrix.mat4.mul(this.m_camera, this.m_translation, this.m_camera);
        this.m_invCamera = glMatrix.mat4.invert(this.m_invCamera, this.m_camera);
    }

    private screenToArcball(p: glMatrix.vec2): glMatrix.quat {
        var dist = glMatrix.vec2.dot(p, p);
        if (dist <= 1.0) {
            return glMatrix.quat.set(glMatrix.quat.create(), p[0], p[1], Math.sqrt(1.0 - dist), 0);
        } else {
            var unitP = glMatrix.vec2.normalize(glMatrix.vec2.create(), p);
            // cgmath is w, x, y, z
            // glmatrix is x, y, z, w
            return glMatrix.quat.set(glMatrix.quat.create(), unitP[0], unitP[1], 0, 0);
        }
    }

    private clamp(a: number, min: number, max: number): number {
        return a < min ? min : a > max ? max : a;
    }
}