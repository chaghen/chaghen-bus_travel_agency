#!/bin/sh
set -e

echo "🚌 BusExpress API — Démarrage..."
cd /var/www/html

# ── Installer les dépendances si vendor/ est vide ─────────────────────────────
if [ ! -f vendor/autoload.php ]; then
  echo "📦 Installation des dépendances Composer..."
  composer install --no-scripts --no-interaction --prefer-dist --no-security-blocking 2>&1
  echo "✅ Composer OK"
fi

# ── Attente PostgreSQL ────────────────────────────────────────────────────────
echo "⏳ Attente PostgreSQL..."
until php -r "
  try {
    new PDO('pgsql:host=postgres;port=5432;dbname=busexpress','busexpress','busexpress_secret',[PDO::ATTR_TIMEOUT=>3]);
    echo 'ok';
  } catch(Exception \$e){ exit(1); }
" 2>/dev/null | grep -q ok; do
  sleep 2
done
echo "✅ PostgreSQL prêt"

# ── Clés JWT ─────────────────────────────────────────────────────────────────
if [ ! -f config/jwt/private.pem ]; then
  echo "🔑 Génération clés JWT..."
  mkdir -p config/jwt
  openssl genrsa -out config/jwt/private.pem -passout pass:busexpress_jwt 4096 2>/dev/null
  openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem -passin pass:busexpress_jwt 2>/dev/null
  chmod 644 config/jwt/private.pem config/jwt/public.pem
  echo "✅ Clés JWT générées"
fi

# ── Cache ─────────────────────────────────────────────────────────────────────
rm -rf var/cache/dev var/cache/prod 2>/dev/null || true

# ── Migrations ────────────────────────────────────────────────────────────────
echo "📦 Migrations..."
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration 2>&1
echo "✅ Migrations OK"

# ── Fixtures : recharge si admin manquant ou table vide ──────────────────────
echo "🌱 Vérification fixtures..."

AGENCY_COUNT=$(php bin/console doctrine:query:sql "SELECT COUNT(*) FROM agency" --no-interaction 2>/dev/null | grep -Eo '[0-9]+' | tail -1 || echo "0")
ADMIN_EXISTS=$(php bin/console doctrine:query:sql "SELECT COUNT(*) FROM agency WHERE email='admin@busexpress.fr'" --no-interaction 2>/dev/null | grep -Eo '[0-9]+' | tail -1 || echo "0")

echo "  Agences en BD : ${AGENCY_COUNT}, Admin : ${ADMIN_EXISTS}"

if [ "${AGENCY_COUNT}" = "0" ] || [ "${ADMIN_EXISTS}" = "0" ]; then
  echo "🌱 Chargement des fixtures (admin manquant ou BD vide)..."
  php bin/console doctrine:fixtures:load --no-interaction 2>&1
  echo "✅ Fixtures chargées"
else
  # Mettre à jour les dates des voyages pour aujourd'hui (sans supprimer les données)
  TODAY=$(date +%Y-%m-%d)
  TRIP_DATE=$(php bin/console doctrine:query:sql "SELECT date FROM trip LIMIT 1" --no-interaction 2>/dev/null | grep -E '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1 | tr -d ' ' || echo "")
  
  if [ -n "$TRIP_DATE" ] && [ "$TRIP_DATE" != "$TODAY" ]; then
    echo "📅 Mise à jour des dates des voyages (${TRIP_DATE} → ${TODAY})..."
    php bin/console doctrine:query:sql "UPDATE trip SET date='${TODAY}'" --no-interaction 2>/dev/null || true
    echo "✅ Dates mises à jour"
  else
    echo "ℹ️  Données à jour (${AGENCY_COUNT} agences, admin présent)"
  fi
fi

# ── Démarrage ─────────────────────────────────────────────────────────────────
echo "🚀 PHP sur 0.0.0.0:8000"
exec php -S 0.0.0.0:8000 -t public/ 2>&1
