# build
FROM node:12 AS build

RUN mkdir -p /app
WORKDIR /app

COPY package*.json /app/

RUN npm install
COPY . /app
RUN npm run build

# prod
FROM node:12

ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000

RUN mkdir -p /app
WORKDIR /app

COPY package*.json /app/
RUN npm install
COPY --from=build /app /app

CMD [ "npm", "run", "start" ]