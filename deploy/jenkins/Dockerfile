FROM docker:cli AS dockercli 

FROM jenkins/jenkins:lts-jdk21

USER root

COPY --from=dockercli /usr/local/bin/docker /usr/local/bin/docker

COPY --from=dockercli /usr/local/libexec/docker/cli-plugins/ /usr/local/libexec/docker/cli-plugins/

RUN jenkins-plugin-cli --plugins \
    workflow-aggregator \
    git \
    credentials-binding