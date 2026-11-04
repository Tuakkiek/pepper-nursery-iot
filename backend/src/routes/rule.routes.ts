import { Router } from 'express';
import {
  getRulesHandler,
  getRuleByIdHandler,
  createRuleHandler,
  updateRuleHandler,
  deleteRuleHandler,
} from '../controllers/rule.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

export const ruleRouter = Router();

// Public / Authenticated read routes (Web and Mobile fetch active rules to display)
ruleRouter.get('/', getRulesHandler);
ruleRouter.get('/:id', getRuleByIdHandler);

// Admin-only management routes (Add, Edit, Delete rules)
ruleRouter.post('/', authenticate, requireAdmin, createRuleHandler);
ruleRouter.put('/:id', authenticate, requireAdmin, updateRuleHandler);
ruleRouter.delete('/:id', authenticate, requireAdmin, deleteRuleHandler);

