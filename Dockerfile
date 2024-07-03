FROM nginx AS runner
WORKDIR /usr/share/nginx/html
COPY ./dist .
COPY ./start-nginx.sh /usr/bin/start-nginx.sh
RUN chmod +x /usr/bin/start-nginx.sh
ENV JSFOLDER="/usr/share/nginx/html/assets/*.js /usr/share/nginx/html/*.html"
#copy nginx config
COPY ./nginx.conf /etc/nginx/nginx.conf
ENTRYPOINT [ "start-nginx.sh" ]