FROM php:8.3-cli-alpine

# Build deps (temporaires pour compilation PECL)
RUN apk add --no-cache --virtual .build-deps \
    autoconf g++ make rabbitmq-c-dev libzip-dev icu-dev linux-headers

# Runtime deps
RUN apk add --no-cache \
    git curl unzip libpq-dev rabbitmq-c icu-libs libzip oniguruma-dev

# PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql zip intl bcmath opcache

# PECL: amqp + redis
RUN pecl install amqp redis \
    && docker-php-ext-enable amqp redis \
    && apk del .build-deps

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json ./

# --no-audit : évite le blocage sur les security advisories pendant le build
# Les advisories sont vérifiées en dev/prod, pas au moment du build Docker
RUN composer install --no-scripts --no-autoloader --prefer-dist --no-interaction --no-security-blocking

COPY . .

RUN composer dump-autoload --optimize

COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public/"]
