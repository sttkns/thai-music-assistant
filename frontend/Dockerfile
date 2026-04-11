# build stage
FROM node:18 AS build

WORKDIR /app

COPY frontend/ /app/

RUN npm install
RUN npm run build

# serve stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html