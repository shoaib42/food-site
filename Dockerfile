# Stage 1: Build React app
FROM node:20 AS react-builder

WORKDIR /app
COPY food/react /app
RUN npm install && npm run build

# Stage 2: PHP and Apache
FROM php:8.3-apache

# Install dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite

# Enable Apache modules
RUN a2enmod headers rewrite

# Copy Apache configuration
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

# Working directory
WORKDIR /var/www/html

# Copy PHP code
COPY food/php /var/www/html/food

# Copy React build output
COPY --from=react-builder /app/build /var/www/html/food

# Copy remaining site files
COPY main /var/www/html
COPY sitechange /var/www/html/sitechange

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Expose port for Apache
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]