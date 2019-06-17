FROM node:11

WORKDIR /opt/kaltura/tcm-configure
ADD . ./

RUN npm install

CMD npm start

ARG VERSION
LABEL version=${VERSION}