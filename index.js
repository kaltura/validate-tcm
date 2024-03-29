/*jshint esversion: 6 */

const fs = require('fs');
const dns = require('dns');
const glob = require('glob');
const yaml = require('yaml');
const http = require('http');
const https = require('https');
const resolveEnv = require('resolve-env');

const configPath = process.env.CONFIG_PATH || '/etc/kaltura/tcm/*.yaml';

const tcm = {
    url: process.env.TCM_URL,
    app: process.env.TCM_APP,
    section: process.env.TCM_SECTION,
    appId: process.env.TCM_APP_ID,
    appSecret: process.env.TCM_APP_SECRET
};
const tcmUrl = `${tcm.url}/${tcm.app}/main/${tcm.section}?app_id=${tcm.appId}&app_secret=${tcm.appSecret}`;
console.log(`TCM URL [${tcmUrl}]`)


function die(err) {
    console.error(err);
    fs.writeFileSync('/dev/termination-log', `TCM ${tcmUrl} Validation Failed: ${err}`);
    process.exit(-1);
}

function validateConfig(tcmConfig) {
    if(!tcmConfig || tcmConfig === 'null') {
        return die('No Configuration');
    }
    tcmConfig = JSON.parse(tcmConfig);
    glob(configPath, (err, files) => {
        if (err) {
            return die(err);
        }
        files.forEach(file => {
            console.log('Reading configuration: ', file);
            const yml = resolveEnv(fs.readFileSync(file, 'utf-8'));
            var config;
            try {
                config = yaml.parse(yml);
            }
            catch (err) {
                return die(`Reading configuration ${file}: ${err.message}`);
            }
            
            config.forEach(({path, regex, validateHostname}) => {
                var currentBranch = tcmConfig;
                var reachedPath = '/';
                var pathParts = path.split('/');
                while(pathParts.length) {
                    var pathPart = pathParts.shift();
                    if(!currentBranch[pathPart]) {
                        return die(`Property ${pathPart} not found under path ${reachedPath}`);
                    }
                    reachedPath += `${pathPart}/`;
                    currentBranch = currentBranch[pathPart];
                }
                if(regex) {
                    var re = new RegExp(regex);
                    if(!re.test(currentBranch)) {
                        return die(`Property ${path} does not match format ${regex}`);
                    }
                }
                if(validateHostname) {
                    if(currentBranch.match(/^[0-9]{1,3}[.][0-9]{1,3}[.][0-9]{1,3}[.][0-9]{1,3}$/)) {
                        dns.reverse(currentBranch, (err, hostnames) => {
                            if(err) {
                                return die(`Property ${path} IP resolution error ${currentBranch}: ${err}`);
                            }
                            if(!hostnames || !hostnames.length) {
                                return die(`Property ${path} IP not found ${currentBranch}`);
                            }
                        });
                    }
                    else {
                        dns.resolve(currentBranch, (err, records) => {
                            if(err) {
                                return die(`Property ${path} hostname resolution error ${currentBranch}: ${err}`);
                            }
                            if(!records || !records.length) {
                                return die(`Property ${path} hostname not found ${currentBranch}`);
                            }
                        });
                    }
                }
            });
        });
    });
}

function getConfig() {
    return new Promise((resolve, reject) => {
        let httpLib = tcmUrl.startsWith('https://') ? https : http;
        httpLib.get(tcmUrl, (resp) => {
            const { statusCode } = resp;
            if (statusCode !== 200) {
                resp.resume();
                return reject(`HTTP Status Code: ${statusCode}`);
            }
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                resolve(data);
            });
        }).on("error", (err) => {
            reject(`Error: ${err.message}`);
        });
    });
}

getConfig()
.then(validateConfig)
.catch(die);
