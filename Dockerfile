# ---------- Stage 1 – build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci                     # keep devDependencies so ng exists
COPY . .
RUN npm run build -- --configuration production

# ---------- Stage 2 – runtime ----------
FROM nginx:1.25-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

# wipe the default welcome page
RUN rm -rf /usr/share/nginx/html/*


# ⬇️ copy the browser bundle (note the /browser/ suffix)
COPY --from=build /app/dist/deepmind-gemma-frontend/browser/ /usr/share/nginx/html/

EXPOSE 8080
CMD ["nginx","-g","daemon off;"]

