FROM node:8.15.0-stretch

ENV PORT 8080
EXPOSE 8080
ENV DOCKER_BUILD "true"

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV
COPY package.json /usr/src/app/
RUN npm install --production && npm cache clean --force
COPY . /usr/src/app

CMD [ "npm", "run", "start:production" ]
