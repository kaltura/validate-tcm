FROM node:11

WORKDIR /opt/kaltura/tcm-configure
ADD *.js ./
ADD *.json ./

RUN npm install

ENV COUCHBASE_URL couchbase1

CMD npm start

ARG VERSION
LABEL version=${VERSION}