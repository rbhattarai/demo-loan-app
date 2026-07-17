FROM node:18-alpine
WORKDIR /app

# Copy loan-webapp certs so lending-webapp can reference them at runtime
COPY loan-webapp/src/certs ./loan-webapp/src/certs

# Build lending-webapp
COPY lending-webapp/package*.json ./lending-webapp/
RUN cd lending-webapp && npm install
COPY lending-webapp/ ./lending-webapp/
RUN cd lending-webapp && npm run build

WORKDIR /app/lending-webapp
EXPOSE 3001
CMD ["node", "dist/server.js"]
