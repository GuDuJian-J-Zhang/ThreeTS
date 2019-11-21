/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
import {THREE}  from '../3rd';

export class Loader {
    private m_manager: THREE.LoadingManager;
    private m_path: string;
    private m_resourcePath: string;
    private m_crossOrigin: string;
    constructor(manager?: THREE.LoadingManager) {
        this.m_path = "";
        this.m_resourcePath = "";
        this.m_crossOrigin = "anonymous";
        this.m_manager = manager ? manager : THREE.DefaultLoadingManager;
    }

    load(url: string, onLoad, onProgress, onError): void {
    }

    parse(data): void {
    }

    setCrossOrigin(crossOrigin): Loader {
        const that = this;
		that.m_crossOrigin = crossOrigin;
		return that;
	}

	setPath(path: string): Loader {
        const that = this;
		that.m_path = path;
		return that;
	}

	setResourcePath(resourcePath: string): Loader {
        const that = this;
		that.m_resourcePath = resourcePath;
		return that;
    }
    
    protected manager(): THREE.LoadingManager {
        const that = this;
        return that.m_manager;
    }

    protected path(): string {
        const that = this;
        return that.m_path;
    }
}
