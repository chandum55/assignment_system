FROM php:8.2-apache

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache mod_rewrite (for .htaccess)
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy project files
COPY . .

# Adjust permissions for uploads folder
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 80
