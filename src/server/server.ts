import * as express from 'express';
import * as cors from 'cors';
import { Listener } from './listener';

export class Server {
    private m_listener: Listener;
    private m_express: express.Express;
    private data_dir: string = process.env.DATA_DIRA;

    constructor() {

        let that = this;

        that.m_express = express();

        that.m_express.use(cors());

        that.m_express.get('/', (req, res) => res.send('Hello GuDuJian!'));

        that.m_express.get("/swc/:filename", function (req, res) {
            const swc_file_name: string = req.params.filename;
            console.log(swc_file_name);
            res.sendFile(`${that.data_dir}/${swc_file_name}`);
        });

        that.m_express.get("/stl/:filename", function (req, res) {
            const stl_file_name: string = req.params.filename;
            console.log(stl_file_name);
            res.sendFile(`${that.data_dir}/test/${stl_file_name}`);
        });

        that.m_express.get("/nii/:filename", function (req, res) {
            const nii_file_name: string = req.params.filename;
            console.log(nii_file_name);
            res.sendFile(`${that.data_dir}/nii/${nii_file_name}`);
        });

        that.m_express.get("/image/:filename", function (req, res) {
            const image_file_name: string = req.params.filename;
            console.log(image_file_name);
            res.sendFile(`${that.data_dir}/images/${image_file_name}`);
        });

        that.m_express.get("/nrrd/:filename", function (req, res) {
            const nrrd_file_name: string = req.params.filename;
            console.log(nrrd_file_name);
            res.sendFile(`${that.data_dir}/nrrd/${nrrd_file_name}`);
        });

        that.m_express.get("/textures/:filename", function (req, res) {
            const texture_file_name: string = req.params.filename;
            console.log(texture_file_name);
            res.sendFile(`${that.data_dir}/textures/${texture_file_name}`);
        });

        that.m_listener = new Listener(that.m_express);
    }

    run(port: number = 8000): void{
        const that = this;
        that.m_listener.port = port;
        this.m_listener.start();
    }
}