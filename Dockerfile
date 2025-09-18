FROM node:22.1.0 as build
ARG ENV
WORKDIR /app
COPY . /app
RUN npm install --legacy-peer-deps
RUN npm run build-$ENV

FROM nginxinc/nginx-unprivileged:1.25
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/nimbuz/browser /usr/share/nginx/html