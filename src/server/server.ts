import * as express from 'express';
import * as cors from 'cors';
import { Listener } from './listener';

export class Server {
    private m_listener: Listener;
    private m_express: express.Express;

    constructor() {

        let that = this;

        that.m_express = express();

        that.m_express.use(cors());

        that.m_express.get('/', (req, res) => res.send('Hello GuDuJian!'));

        that.m_express.get("/swc/:filename", function (req, res) {
            const swc_file_name: string = req.params.filename;
            console.log(swc_file_name);
            res.sendFile(`/Users/zebrafish/work/data/${swc_file_name}`);
        });

        that.m_express.get("/stl/:filename", function (req, res) {
            const stl_file_name: string = req.params.filename;
            console.log(stl_file_name);
            res.sendFile(`/Users/zebrafish/work/data/test/${stl_file_name}`);
        });

        that.m_express.get("/nii/:filename", function (req, res) {
            const nii_file_name: string = req.params.filename;
            console.log(nii_file_name);
            res.sendFile(`/Users/zebrafish/work/data/${nii_file_name}`);
        });

        that.m_express.get("/image/:filename", function (req, res) {
            const stl_file_name: string = req.params.filename;
            console.log(stl_file_name);
            res.sendFile(`/Users/zebrafish/work/data/images/${stl_file_name}`);
        });

        that.m_express.get("/nrrd/:filename", function (req, res) {
            const nrrd_file_name: string = req.params.filename;
            console.log(nrrd_file_name);
            res.sendFile(`/Users/zhangjun/work/gudujian/ThreeTS/data/nrrd/${nrrd_file_name}`);
        });

        that.m_express.get("/textures/:filename", function (req, res) {
            const texture_file_name: string = req.params.filename;
            console.log(texture_file_name);
            res.sendFile(`/Users/zhangjun/work/gudujian/ThreeTS/data/textures/${texture_file_name}`);
        });

        that.m_listener = new Listener(that.m_express);
    }

    run(port: number = 8000): void{
        const that = this;
        that.m_listener.port = port;
        this.m_listener.start();
    }
}