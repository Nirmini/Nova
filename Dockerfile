FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .
RUN node -v && npm -v


ENV NODE_ENV=production
CMD ["npm", "start"]
