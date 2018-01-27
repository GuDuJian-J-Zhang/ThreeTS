/**
 * @author gudujian
 * @email zhangjun_dg@mail.dlut.edu.cn /
 */
declare namespace helper {
    class ImprovedNoise {
        private m_p;
        constructor();
        noise(x: number, y: number, z: number): number;
        private init();
        private fade(t);
        private lerp(t, a, b);
        private grad(hash, x, y, z);
    }
}
