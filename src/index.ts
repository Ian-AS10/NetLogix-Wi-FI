import { DefenseManager } from './modules/core';
import { BGAOptimizer } from './modules/optimization';
import { startDashboard } from './modules/web';

const bga = new BGAOptimizer();
const manager = new DefenseManager(bga);

startDashboard(manager, 3000);
