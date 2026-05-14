#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║       🔍 VERIFICANDO REGISTRO EN BASE DE DATOS         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if any Google accounts exist
echo "📋 Buscando cuentas con Google OAuth..."
docker exec domicilios-db psql -U postgres -d domicilios -c "
SELECT
  u.id,
  u.email,
  u.name,
  u.image,
  u.created_at,
  a.provider,
  a.provider_account_id
FROM users u
LEFT JOIN accounts a ON u.id = a.user_id
WHERE a.provider = 'google'
ORDER BY u.created_at DESC;
" 2>&1

echo ""
echo "📊 Total de usuarios en la base de datos:"
docker exec domicilios-db psql -U postgres -d domicilios -c "SELECT COUNT(*) as total_usuarios FROM users;" 2>&1

echo ""
echo "📊 Total de cuentas OAuth (Google):"
docker exec domicilios-db psql -U postgres -d domicilios -c "SELECT COUNT(*) as total_google FROM accounts WHERE provider = 'google';" 2>&1

echo ""
echo "✅ Verificación completada"
