#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║       🔍 VERIFICANDO Y LIMPIANDO BASE DE DATOS         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "📋 Buscando cuentas creadas con Google OAuth..."
echo ""
docker exec domicilios-db psql -U postgres -d domicilios << 'EOF'
SELECT
  u.id as user_id,
  u.email,
  u.name,
  u.image,
  u.email_verified,
  u.created_at,
  a.provider,
  a.provider_account_id,
  a.access_token,
  a.id_token
FROM users u
LEFT JOIN accounts a ON u.id = a.user_id
WHERE a.provider = 'google'
ORDER BY u.created_at DESC
LIMIT 10;
EOF

echo ""
echo "📊 Estadísticas:"
echo ""
echo "Total de usuarios:"
docker exec domicilios-db psql -U postgres -d domicilios -c "SELECT COUNT(*) as total FROM users;"

echo ""
echo "Total de cuentas OAuth (Google):"
docker exec domicilios-db psql -U postgres -d domicilios -c "SELECT COUNT(*) as total FROM accounts WHERE provider = 'google';"

echo ""
echo "Total de cuentas (todas):"
docker exec domicilios-db psql -U postgres -d domicilios -c "SELECT COUNT(*) as total FROM accounts;"

echo ""
echo "Ofertas de cleanup:"
echo "Para limpiar todos los usuarios y cuentas, ejecutar:"
echo "  docker exec domicilios-db psql -U postgres -d domicilios -c \"DELETE FROM accounts; DELETE FROM users;\""

echo ""
echo "✅ Verificación completada"
