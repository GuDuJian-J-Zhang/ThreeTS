/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
import {THREE}  from '../3rd';

export class LoadingManager {
    private m_handlers = [];
    constructor() {
    }

    getHandler(file): void {
        const that = this;
        const num_handlers: number = that.m_handlers.length;
		for (let i = 0; i < num_handlers; i += 2 ) {
			let regex = that.m_handlers[ i ];
			let loader = that.m_handlers[ i + 1 ];
			if (regex.global) {
                regex.lastIndex = 0; // see #17920
            }
			if (regex.test(file)) {
				return loader;
			}
		}
		return null;
	}
}
