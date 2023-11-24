ARG CONTAINER_VARIANT=ubuntu
FROM mcr.microsoft.com/vscode/devcontainers/base:${CONTAINER_VARIANT}

ARG NODEJS_VERSION=20.8.1

RUN apt-get update && apt-get install -y \
    curl \
    git \
    jq \
    unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

## AWS CLI のインストール
RUN curl -sL https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o awscliv2.zip && \
  unzip awscliv2.zip && \
  sudo ./aws/install && \
  rm -rf awscliv2.zip aws

## GitHub CLI のインストール
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && sudo apt-get update \
    && sudo apt-get install gh -y

## git-secrets のインストール
RUN git clone https://github.com/awslabs/git-secrets.git
RUN cd git-secrets && make install && cd .. && rm -rf git-secrets

SHELL [ "/bin/bash", "-lc" ]
USER vscode
WORKDIR /home/vscode

## asdf のインストール
RUN git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.13.1
RUN echo '. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc
RUN echo '. "$HOME/.asdf/completions/asdf.bash"' >> ~/.bashrc

ENV PATH="/home/vscode/.asdf/shims:/home/vscode/.asdf/bin:${PATH}"

## Node.js のインストール
RUN source ~/.bashrc && \
  asdf plugin add nodejs && \
  asdf install nodejs ${NODEJS_VERSION} && \
  asdf global nodejs ${NODEJS_VERSION}

## AWS CDK のインストール
RUN npm install -g aws-cdk
