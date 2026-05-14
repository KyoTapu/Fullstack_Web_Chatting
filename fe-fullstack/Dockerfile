FROM node:20 as dist

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# dùng nginx serve static
FROM nginx:alpine

COPY --from=dist /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
