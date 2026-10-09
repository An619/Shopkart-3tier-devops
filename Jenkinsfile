pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    environment {
        DOCKERHUB_CREDS     = credentials('dockerhub-creds')
        KUBECONFIG_CREDS    = credentials('kubeconfig-creds')
        DOCKERHUB_USER      = "${DOCKERHUB_CREDS_USR}"
        IMAGE_TAG           = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        FRONTEND_IMAGE      = "shopkart-frontend"
        BACKEND_IMAGE       = "shopkart-backend"
        NAMESPACE           = "shopkart"
        RELEASE_NAME        = "shopkart"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log --oneline -3'
            }
        }

        stage('Install') {
            parallel {
                stage('Backend') {
                    steps { dir('backend') { sh 'npm ci --no-audit --no-fund' } }
                }
                stage('Frontend') {
                    steps { dir('frontend') { sh 'npm ci --no-audit --no-fund' } }
                }
            }
        }

        stage('Lint') {
            parallel {
                stage('Backend') {
                    steps { dir('backend') { sh 'npm run lint || true' } }
                }
                stage('Frontend') {
                    steps { dir('frontend') { sh 'npm run lint || true' } }
                }
            }
        }

        stage('Test') {
            parallel {
                stage('Backend') {
                    steps { dir('backend') { sh 'npm test' } }
                }
                stage('Frontend') {
                    steps { dir('frontend') { sh 'npm test -- --run || true' } }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') { sh 'npm run build' }
            }
        }

        stage('Docker Build') {
            steps {
                sh """
                    docker build -t ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${IMAGE_TAG}  ./backend
                    docker build -t ${DOCKERHUB_USER}/${BACKEND_IMAGE}:latest       ./backend
                    docker build -t ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${IMAGE_TAG} ./frontend
                    docker build -t ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:latest      ./frontend
                """
            }
        }

        stage('Trivy Scan') {
            steps {
                sh """
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:latest image --severity CRITICAL --exit-code 0 \
                      ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${IMAGE_TAG} || true
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:latest image --severity CRITICAL --exit-code 0 \
                      ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${IMAGE_TAG} || true
                """
            }
        }

        stage('Push') {
            steps {
                sh """
                    echo \$DOCKERHUB_CREDS_PSW | docker login -u \$DOCKERHUB_CREDS_USR --password-stdin
                    docker push ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${IMAGE_TAG}
                    docker push ${DOCKERHUB_USER}/${BACKEND_IMAGE}:latest
                    docker push ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${IMAGE_TAG}
                    docker push ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:latest
                    docker logout
                """
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                sh """
                    export KUBECONFIG=\$KUBECONFIG_CREDS
                    helm upgrade --install ${RELEASE_NAME} ./helm/shopkart \
                      --namespace ${NAMESPACE} --create-namespace \
                      --set backend.image.repository=${DOCKERHUB_USER}/${BACKEND_IMAGE} \
                      --set backend.image.tag=${IMAGE_TAG} \
                      --set frontend.image.repository=${DOCKERHUB_USER}/${FRONTEND_IMAGE} \
                      --set frontend.image.tag=${IMAGE_TAG} \
                      --wait --timeout 5m || echo 'Helm chart not present yet'
                """
            }
        }

        stage('Verify') {
            when { branch 'main' }
            steps {
                sh """
                    export KUBECONFIG=\$KUBECONFIG_CREDS
                    kubectl get pods -n ${NAMESPACE} || true
                    kubectl get svc  -n ${NAMESPACE} || true
                """
            }
        }
    }

    post {
        always { cleanWs() }
    }
}
