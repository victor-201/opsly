const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const wanted = ['User', 'Organization', 'ProviderConnection', 'AuditLog', 'Incident', 'Alert', 'Resource', 'Application'];
  for (const t of wanted) {
    if (p[t]) {
      try {
        const c = await p[t].count();
        console.log(t + '=' + c);
      } catch (e) {
        console.log(t + '=ERR ' + e.message);
      }
    } else {
      console.log(t + '=NOT-A-MODEL');
    }
  }
  await p.$disconnect();
})();