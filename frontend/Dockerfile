FROM node:20-alpine

WORKDIR /app
ARG NEXT_PUBLIC_API_URL=/api
ARG API_PROXY_TARGET=http://backend:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV API_PROXY_TARGET=${API_PROXY_TARGET}

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
