
@Library('kaltura')_

pipeline {

    agent { 
        label 'Ubuntu'
    }
    environment {
        version = sh(script: 'cat package.json | grep version | head -1 | awk -F: \'{ print $2 }\' | sed \'s/[",]//g\' | sed \'s/^ *//;s/ *$//\'', returnStdout: true).trim()
    }

    stages { 
        stage('Build') {
            steps {
                script {
                    docker.build('validate-tcm:$BUILD_NUMBER', '--build-arg VERSION=$version .')
                }
                env.DEPLOY_AS_LATEST = "true"
                deploy('validate-tcm', "$version")
            }
        }
    }
}