const postgres = require('postgres')

async function checkDatabase() {
  const sql = postgres('postgresql://postgres:postgres@127.0.0.1:5432/domicilios')

  try {
    // Contar usuarios
    const users = await sql`SELECT COUNT(*) as count FROM users`
    console.log(`\n📊 Total users in database: ${users[0].count}`)

    // Listar usuarios
    const allUsers = await sql`SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 10`
    if (allUsers.length > 0) {
      console.log('\n👥 Last 10 users:')
      allUsers.forEach((user) => {
        console.log(`   - ${user.email} (${user.name}) created at ${user.created_at}`)
      })
    }

    // Contar cuentas OAuth
    const accounts = await sql`SELECT COUNT(*) as count FROM accounts`
    console.log(`\n🔐 Total OAuth accounts: ${accounts[0].count}`)

    // Listar cuentas OAuth
    const lastAccounts = await sql`SELECT user_id, provider, type, created_at FROM accounts ORDER BY created_at DESC LIMIT 5`
    if (lastAccounts.length > 0) {
      console.log('\n🔑 Last 5 OAuth accounts:')
      lastAccounts.forEach((account) => {
        console.log(`   - User ${account.user_id}: ${account.provider} (${account.type}) at ${account.created_at}`)
      })
    }

    // Verificar si hay sesiones
    const sessions = await sql`SELECT COUNT(*) as count FROM sessions`
    console.log(`\n📋 Total sessions: ${sessions[0].count}`)
  } catch (error) {
    console.error('❌ Database error:', error.message)
  } finally {
    await sql.end()
  }
}

checkDatabase()
