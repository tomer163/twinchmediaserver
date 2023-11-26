import NodeMediaServer from "node-media-server";
import ffmpeg from "fluent-ffmpeg";
import { path } from '@ffmpeg-installer/ffmpeg'
import axios from "axios";
import * as fs from 'node:fs';

ffmpeg.setFfmpegPath(path)

const config = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        mediaroot: './live',
        allow_origin: '*'
    }
}

var nms = new NodeMediaServer(config)
nms.run()
nms.on('prePublish', async(id, StreamPath, args) => {
    let session = nms.getSession(id)
    try{
        const res = await axios.get(`http://localhost:3000/streamToUser/${StreamPath.split('/')[2]}`)
        console.log(`rtmp://localhost:1935${StreamPath}`)
        ffmpeg(`rtmp://localhost:1935${StreamPath}`)
        .addOptions([
            '-c:v libx264',
            '-c:a aac',
            '-ac 1',
            '-strict -2',
            '-crf 18',
            '-profile:v baseline',
            '-maxrate 400k',
            '-bufsize 1835k',
            '-pix_fmt yuv420p',
            '-hls_time 1',
            '-hls_list_size 4',
            '-hls_wrap 10',
            '-start_number 1',
        ])
        .output(`./live/${res.data.username}.m3u8`)
        .run()
        console.log(session)

    } catch(err){
        session.reject()
    }
})