/**
 * @typedef {title: string, url: string, thumbs: {id: string, width: string, height: string, url: string}, id: string, channel: string, channel_id: string, duration: number} RestrictedInfoStyle
 */

import fs from 'fs'
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { finished, Readable } from 'stream';
const YTDLP = path.join(__dirname, "..", "data", "yt-dlp.exe");
const YTDLP_VERSION = "2024.04.09"
const YTDLP_DOWNLOAD = `https://github.com/yt-dlp/yt-dlp/releases/download/${YTDLP_VERSION}/yt-dlp.exe`;
import cproc from 'child_process'

class YTDLPWrapper {
    constructor() {
        this.command = null;
        this.infoStyle = `"%(.{title,url,id,channel,channel_id,duration,thumbnails_table})j`;
        // this.infoStyle = `"%()j`;
    }

    initialize() {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(YTDLP)) { // check local instance
                this.command = YTDLP;
                return resolve(true);
            }
            cproc.exec("yt-dlp", (err, stdout, stderr) => { // check default PATH name
                if (err.code === 2) {
                    this.command = "yt-dlp"
                    return resolve(true)
                }
                cproc.exec("ytdlp", async (err, stdout, stderr) => { // check modified PATH name
                    if (err.code === 2) {
                        this.command = "ytdlp"
                        return resolve(true)
                    }
                    const didInstall = await this.tryInstall();
                    if(didInstall) this.command = YTDLP;
                    return resolve(didInstall);
                })
            })
        })
    }

    async tryInstall() {
        return new Promise(async (resolve, reject) => {
            const fileStream = fs.createWriteStream(YTDLP, { flags: 'wx' });
            finished(Readable.fromWeb((await fetch("https://dork.nathansbud-cors.workers.dev/?" + encodeURI(YTDLP_DOWNLOAD))).body).pipe(fileStream), (err) => {
                resolve(err == undefined);
            });
        })
    }

    cmd() {
        return new ExecBuilder(this.command);
    }

    async getVersion() {
        return (await this.cmd().add("--version").exec()).stdout;
    }

    /**
     * 
     * @param {string} url 
     * @returns {RestrictedInfoStyle}
     */
    async getVideoInfo(url) {
        const result = await this.cmd().add(url).add("--skip-download", `--print`, this.infoStyle).exec();
        if(result.err || result.stderr) return result;
        return this.parse(result.stdout);
    }

        /**
     * 
     * @param {string} search 
     * @param {number | string} count
     * @returns {Promise<RestrictedInfoStyle[]>}
     */
    async searchVideo(search, count = 50) {
        const result = await this.cmd().add(`ytsearch${count}:"${search}"`).add("--match-filter \"url!*=/shorts/\"").add("--flat-playlist", "--skip-download", `--print`, this.infoStyle).exec();
        if(result.err || result.stderr) return result;
        return this.parse(result.stdout);
    }

    parse(json) {
        var njson = JSON.parse(`[${json.trim().split("\n").join(",")}]`);
        for(var x in njson) {
            var nnjson = njson[x];
            if(nnjson.thumbnails_table) {
                var thumbs = nnjson.thumbnails_table.split("\n");
                thumbs = thumbs.filter((v) => v.indexOf("unknown") === -1 && !v.startsWith("ID"));
                thumbs = thumbs.map((thumb) => {
                    var td = thumb.split(" ").filter((v) => v);
                    return {id: td[0], width: td[1], height: td[2], url: td[3]}
                })
                thumbs.sort((a, b) => b.width - a.width)
                nnjson.thumbnails_table = null;
                nnjson.thumbs = thumbs;
                njson[x] = nnjson
            }
        }
        
        return njson;
    }


}


class ExecBuilder {
    constructor(command) {
        this.command = command;
    }
    add(...cl) {
        this.command = this.command + (cl[0].startsWith(" ") ? cl.join(" ") : ` ${cl.join(" ")}`);
        return this;
    }
    /**
     * 
     * @returns {Promise<{err: cproc.ExecException | null, stdout: string, stderr: string}>}
     */
    exec() {
        return new Promise((resolve, reject) => {
            cproc.exec(this.command, (err, stdout, stderr) => {
                resolve({err, stdout, stderr});
            })
        })
    }
    get() {
        return this.command;
    }
}

export default YTDLPWrapper;