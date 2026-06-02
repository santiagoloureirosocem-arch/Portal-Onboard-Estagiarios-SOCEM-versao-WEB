const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection(
    'mysql://root:NrzfqMgcocxukPIsSFcQDjzIkqAreoco@yamanote.proxy.rlwy.net:40537/railway'
  );

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS direct_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      senderId INT NOT NULL,
      senderName VARCHAR(255) NOT NULL,
      receiverId INT NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      fileName VARCHAR(255),
      fileUrl LONGTEXT,
      fileSize VARCHAR(50),
      fileType VARCHAR(50),
      isRead BOOLEAN NOT NULL DEFAULT FALSE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Tabela direct_messages criada com sucesso!');

  const [rows] = await conn.execute('SHOW TABLES');
  console.log('Tabelas na BD:', rows.map(r => Object.values(r)[0]));

  await conn.end();
}

run().catch(e => { console.error('Erro:', e.message); process.exit(1); });
