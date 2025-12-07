FROM --platform=linux/amd64 mongo:latest

# Set environment variables
ENV PORT=8080
ENV MONGODB_PORT=27017

EXPOSE $MONGODB_PORT
EXPOSE $PORT

# Create directory for data
RUN mkdir -p /data/db

# Create startup script
RUN echo '#!/bin/bash\nmongod --bind_ip 0.0.0.0 --port ${MONGODB_PORT}' > /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Use startup script as entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]