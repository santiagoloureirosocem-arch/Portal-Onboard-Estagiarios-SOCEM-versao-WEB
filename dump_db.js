const mysql = require("mysql2/promise");
const fs = require("fs");

async function dump() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log("Connected!");

  const [rows] = await conn.query("SHOW TABLES");
  const tables = rows.map(r => Object.values(r)[0]);
  console.log("Tables:", tables.join(", "));

  let out = "USE portal_socm;\n\n";
  let total = 0;

  for (const table of tables) {
    try {
      const [data] = await conn.query("SELECT * FROM `" + table + "`");
      if (!data.length) { console.log("  " + table + ": 0 rows"); continue; }
      const cols = Object.keys(data[0]);
      for (const row of data) {
        const vals = cols.map(c => {
          const v = row[c];
          if (v === null || v === undefined) return "NULL";
          if (typeof v === "boolean") return v ? "1" : "0";
          if (typeof v === "number") return String(v);
          if (v instanceof Date) return "'" + v.toISOString().slice(0, 19).replace("T", " ") + "'";
          if (Buffer.isBuffer(v)) return v[0] ? "1" : "0";
          return "'" + String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
        });
        out += "INSERT INTO `" + table + "` (`" + cols.join("`, `") + "`) VALUES (" + vals.join(", ") + ");\n";
      }
      console.log("  " + table + ": " + data.length + " rows");
      total += data.length;
    } catch(e) {
      console.log("  " + table + ": SKIPPED " + e.message);
    }
  }

  await conn.end();
  fs.writeFileSync("railway_dump.sql", out, "utf-8");
  console.log("Total: " + total + " rows -> railway_dump.sql");
}

dump().catch(e => console.error(e));
