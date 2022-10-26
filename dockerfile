FROM node:16
EXPOSE 2567
copy . .
run npm ci