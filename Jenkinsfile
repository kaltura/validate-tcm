
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
                    env.DOCKER_BUILD_TAG = UUID.randomUUID().toString()
                    docker.build('validate-tcm:$DOCKER_BUILD_TAG', '--build-arg VERSION=$version .')
                }                
            }
        }
        stage('Deploy') {
            steps {
                deploy('validate-tcm', "$version", 'dev', false, false)
            }
        }
    }
}