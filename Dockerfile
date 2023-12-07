FROM node:20.10.0-alpine

WORKDIR /opt/api 

COPY package*.json ./
COPY prisma ./prisma/

# pas sur pour le .env
# COPY .env ./ 
COPY tsconfig.json ./

COPY . .

RUN npm install

RUN npx prisma generate

EXPOSE 80

CMD npm start
