FROM node:16
WORKDIR /app
COPY package*.json .
ARG NODE_ENV
RUN if [ "$NODE_ENV" = "production" ]; \
    then yarn install --production; \
    else yarn install; \
    fi
COPY . ./
# RUN 
ENV PORT 3000
EXPOSE ${PORT}