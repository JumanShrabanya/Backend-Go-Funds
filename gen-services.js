const fs = require('fs');
const services = ['user-validation', 'risk-assessment', 'goal-analysis', 'asset-allocation', 'fund-eligibility', 'fund-scoring', 'portfolio-construction', 'investment-calculator', 'plan-explanation', 'recommendation'];
services.forEach(svc => {
  const className = svc.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Service';
  const content = `import { Injectable } from '@nestjs/common';\n\n@Injectable()\nexport class ${className} {}\n`;
  fs.writeFileSync(`src/modules/planner/services/${svc}.service.ts`, content);
});
