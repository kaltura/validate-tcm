/*jshint esversion: 6 */

const fs = require('fs');
const glob = require('glob');
const couchbase = require('couchbase');
const resolveEnv = require('resolve-env');

const configPath = process.env.CONFIG_PATH || '/etc/kaltura/tcm/*.json';
const couchbaseHost = process.env.COUCHBASE || 'couchbase1';

const cluster = new couchbase.Cluster('couchbase://' + couchbaseHost);
const bucket = cluster.openBucket('TCM');

function die(err) {
    console.error(err);
    fs.writeFileSync('/dev/termination-log', `TCM Validation: ${err}`);
    process.exit(-1);
}

function validateConfig(file) {
    console.log('Reading configuration: ', file);
    const json = resolveEnv(fs.readFileSync(file, 'utf-8'));
    var config;
    try{
        config = JSON.parse(json);
    }
    catch(err) {
        return die(`Reading configuration [${file}]: err.message`);
    }

    const {app, path, regex} = config;
    
    bucket.get(app, function(err, result) {
        if (err) {
            if(err.code === 13) {
                return die(`Application [${app}] not found`);
            }
            return die(`Application [${app}] couchbase error: ${err.message}`);
        }

        console.dir(result);
    });
}

glob(configPath, (err, files) => {
    if(err) {
        return die(err);
    }

    files.forEach(validateConfig);
});
