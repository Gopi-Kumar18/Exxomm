# ---- Build Stage ----
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# ---- Serve Stage ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Rendered via nginx's built-in envsubst-on-templates entrypoint using
# BACKEND_HOST/BACKEND_PORT from the container environment (see
# docker-compose.yml). proxy_pass in the template uses a variable, so these
# defaults being unresolvable in production (no dedicated backend hostname
# there) doesn't stop nginx from starting -- see nginx.conf.template.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV BACKEND_HOST=backend \
    BACKEND_PORT=3000

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
