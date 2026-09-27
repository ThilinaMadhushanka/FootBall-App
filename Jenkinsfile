pipeline {
  agent any

  options {
    disableConcurrentBuilds()
  }

  triggers {
    pollSCM('H/5 * * * *')
  }

  parameters {
    string(
      name: 'ACR_SERVER',
      defaultValue: 'playerprothilina0616.azurecr.io',
      description: 'Terraform acr_server output'
    )
  }

  stages {
    stage('Prepare') {
      steps {
        script {
          env.SKIP_BUILD = sh(
            script: "git log -1 --pretty=%B | grep -Fq '[skip ci]' && echo true || echo false",
            returnStdout: true
          ).trim()

          env.IMAGE_TAG = sh(
            script: 'git rev-parse --short=12 HEAD',
            returnStdout: true
          ).trim()
        }

        sh '''
          set -eu
          printf '%s' "$ACR_SERVER" |
            grep -Eq '^[a-z0-9]+[.]azurecr[.]io$'
        '''
      }
    }

    stage('Test and build') {
      when {
        expression { env.SKIP_BUILD != 'true' }
      }

      steps {
        sh '''
          set -eu

          for service in frontend backend ai-service; do
            docker build \
              -t "$ACR_SERVER/playerpro-$service:$IMAGE_TAG" \
              "$service"
          done
        '''
      }
    }

    stage('Push ACR') {
      when {
        expression { env.SKIP_BUILD != 'true' }
      }

      steps {
        withCredentials([
          usernamePassword(
            credentialsId: 'acr-push',
            usernameVariable: 'ACR_USER',
            passwordVariable: 'ACR_PASSWORD'
          )
        ]) {
          sh '''
            set +x
            set -eu

            export DOCKER_CONFIG="$(mktemp -d)"
            trap 'rm -rf "$DOCKER_CONFIG"' EXIT

            printf '%s' "$ACR_PASSWORD" |
              docker login "$ACR_SERVER" \
                --username "$ACR_USER" \
                --password-stdin

            for service in frontend backend ai-service; do
              docker push "$ACR_SERVER/playerpro-$service:$IMAGE_TAG"
            done
          '''
        }
      }
    }

    stage('Update Git deployment tag') {
      when {
        expression { env.SKIP_BUILD != 'true' }
      }

      steps {
        withCredentials([
          usernamePassword(
            credentialsId: 'github-push',
            usernameVariable: 'GIT_USER',
            passwordVariable: 'GIT_TOKEN'
          )
        ]) {
          sh '''
            set +x
            set -eu

            ASKPASS_FILE="$(mktemp)"
            trap 'rm -f "$ASKPASS_FILE"' EXIT

            cat > "$ASKPASS_FILE" <<'EOF'
#!/bin/sh
case "$1" in
  *Username*) printf '%s' "$GIT_USER" ;;
  *) printf '%s' "$GIT_TOKEN" ;;
esac
EOF

            chmod 700 "$ASKPASS_FILE"

            export GIT_ASKPASS="$ASKPASS_FILE"
            export GIT_TERMINAL_PROMPT=0

            git config user.name 'PlayerPro CI'
            git config user.email 'playerpro-ci@example.invalid'

            printf 'registry: %s\\ntag: "%s"\\nfrontendServiceType: ClusterIP\\n' \
              "$ACR_SERVER" "$IMAGE_TAG" \
              > deploy/environments/lab.yaml

            git add deploy/environments/lab.yaml

            if ! git diff --cached --quiet; then
              git commit -m "deploy: $IMAGE_TAG [skip ci]"
              git push origin HEAD:Azure
            fi
          '''
        }
      }
    }
  }
}
