FROM node:8-onbuild

ENV PORT 8080
EXPOSE 8080
ENV APMSERVE_RINKEBY_IPFS "ipfs.aragon.network"
ENV HOST "aragonpm.com"
ENV DOCKER_BUILD "true"
