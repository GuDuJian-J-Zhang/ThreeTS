declare namespace helper {
    class ImprovedNoise {
        private m_p;
        constructor();
        private init();
        private fade(t);
        private lerp(t, a, b);
        private grad(hash, x, y, z);
        noise(x: number, y: number, z: number): number;
    }
}
