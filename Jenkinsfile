
@Library('kaltura')_

pipeline {

    agent { 
        label 'Ubuntu'
    }
    environment {
        version = sh(script: 'cat package.json | grep version | head -1 | awk -F: \'{ print $2 }\' | sed \'s/[",]//g\' | sed \'s/^ *//;s/ *$//\'', returnStdout: true).trim()
        DEPLOY_AS_LATEST = "true"
    }

    stages { 
        stage('Build') {
            steps {
                script {
                    docker.build('validate-tcm:$BUILD_NUMBER', '--build-arg VERSION=$version .')
                }
                deploy('validate-tcm', "$version", 'dev', false, false)
            }
        }
    }
}