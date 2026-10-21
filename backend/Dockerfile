FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    git unzip libpq-dev libzip-dev libpng-dev libonig-dev libcurl4-openssl-dev curl \
    && docker-php-ext-install pdo_pgsql zip bcmath mbstring curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . /app

RUN composer install --no-dev --no-interaction --prefer-dist

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
