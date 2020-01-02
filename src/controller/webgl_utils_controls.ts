/**
 * @author gudujian / zhangjun_dg@mail.dlut.edu.cn/
 */
import {glMatrix} from '../../src/3rd';

export class Controller {
    private m_mousemove;
    private m_press;
    private m_wheel;
    private m_twoFingerDrag;
    private m_pinch;

    constructor() {

    }

    registerForCanvas(canvas: HTMLCanvasElement): void {
        let prevMouse = null;
        let mouseState = [false, false];
        const self = this;
        canvas.addEventListener("mousemove", (evt) => {
            evt.preventDefault();
            var rect = canvas.getBoundingClientRect();
            var curMouse = [evt.clientX - rect.left, evt.clientY - rect.top];
            if (!prevMouse) {
                prevMouse = [evt.clientX - rect.left, evt.clientY - rect.top];
            } else if (self.m_mousemove) {
                self.m_mousemove(prevMouse, curMouse, evt);
            }
            prevMouse = curMouse;
        });

        canvas.addEventListener("mousedown", (evt) => {
            evt.preventDefault();
            var rect = canvas.getBoundingClientRect();
            var curMouse = [evt.clientX - rect.left, evt.clientY - rect.top];
            if (self.m_press) {
                self.m_press(curMouse, evt);
            }
        });
    
        canvas.addEventListener("wheel", function(evt) {
            evt.preventDefault();
            if (self.m_wheel) {
                self.m_wheel(-evt.deltaY);
            }
        });

        canvas.oncontextmenu = function (evt) {
            evt.preventDefault();
        };
    
        var touches = {};
        canvas.addEventListener("touchstart", function(evt) {
            var rect = canvas.getBoundingClientRect();
            evt.preventDefault();
            for (var i = 0; i < evt.changedTouches.length; ++i) {
                var t = evt.changedTouches[i];
                touches[t.identifier] = [t.clientX - rect.left, t.clientY - rect.top];
                if (evt.changedTouches.length == 1 && self.m_press) {
                    self.m_press(touches[t.identifier], evt);
                }
            }
        });
    }

    set mousemove(val: Function) {
        const that = this;
        that.m_mousemove = val;
    }

    set press(val: Function) {
        const that = this;
        that.m_press = val;
    }

    set wheel(val: Function) {
        const that = this;
        that.m_wheel = val;
    }
}