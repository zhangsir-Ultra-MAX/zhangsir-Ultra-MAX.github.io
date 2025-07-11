#!/bin/bash
# 仓库地址。 还有 docker.dev.isecsp.com
repo=docker.isecsp.com

# 目录的最后两层，即:  群组名称/项目名称
group_project=$(pwd | rev | cut -d / -f 1-2 - | rev)

# 获取当前分支名称，例如:  master ,  dev
branch=$(git rev-parse --abbrev-ref HEAD)

# 获取最后一次签入的时间 以及 hash
tag=$(git log --pretty=%ad-%h --date=format:'%y%m%d%H%M' -n 1)

docker build -t "${repo}/${group_project}-${branch}:${tag}" .
