FROM node:14.15-alpine as build
WORKDIR /most-popular
ENV NODE_ENV production
ADD package.json yarn.lock /most-popular/
ADD api /most-popular/api
# ADD packages /most-popular/packages
RUN yarn --production --pure-lockfile
WORKDIR /most-popular/api

FROM node:14.15-alpine
ENV NODE_ENV production
ENV PORT 80
COPY --from=build /most-popular /most-popular
WORKDIR /most-popular/api
ENTRYPOINT [ "node", "src/index.js" ]
