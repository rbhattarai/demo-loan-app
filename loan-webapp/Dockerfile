FROM node:18-alpine
WORKDIR /app/loan-webapp
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]
