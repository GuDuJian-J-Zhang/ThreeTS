/**
 * @author gudujian
 * @email zhangjun_dg@mail.dlut.edu.cn /
 */
declare namespace helper {
    class ImprovedNoise {
        private m_p;
        constructor();
        noise(x: number, y: number, z: number): number;
        private init;
        private fade;
        private lerp;
        private grad;
    }
}
