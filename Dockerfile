# Use an official lightweight Nginx image as the base
FROM nginx:alpine

# Remove the default Nginx welcome page configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx configuration file to the container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all the application files (HTML, TSX, custom error pages, etc.) 
# to the Nginx web root directory
COPY . /usr/share/nginx/html

# Expose port 80 to the outside world (Nginx default port)
EXPOSE 80

# The command to run when the container starts, keeping Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]