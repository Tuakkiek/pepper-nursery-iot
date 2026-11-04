import { Request, Response } from 'express';
import { CreateCareRuleSchema, UpdateCareRuleSchema } from '../schemas/rule.schema';
import { careRuleService } from '../services/care-rule.service';

export async function getRulesHandler(req: Request, res: Response): Promise<void> {
  const onlyActive = req.query.all !== 'true';
  try {
    const rules = await careRuleService.getAllRules(onlyActive);
    res.status(200).json({
      status: 'ok',
      total: rules.length,
      rules,
    });
  } catch (err: any) {
    console.error('Failed to get care rules:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Failed to fetch care rules',
      },
    });
  }
}

export async function getRuleByIdHandler(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: { code: 'invalid_id', message: 'Rule ID must be a number' } });
    return;
  }

  try {
    const rule = await careRuleService.getRuleById(id);
    if (!rule) {
      res.status(404).json({ error: { code: 'rule_not_found', message: `Rule #${id} not found` } });
      return;
    }
    res.status(200).json({ status: 'ok', rule });
  } catch (err: any) {
    console.error('Failed to get rule by id:', err);
    res.status(500).json({ error: { code: 'server_error', message: 'Failed to fetch rule' } });
  }
}

export async function createRuleHandler(req: Request, res: Response): Promise<void> {
  const parseResult = CreateCareRuleSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    res.status(400).json({
      error: {
        code: 'invalid_rule_data',
        message: errorDetails,
      },
    });
    return;
  }

  try {
    const newRule = await careRuleService.createRule(parseResult.data);
    res.status(201).json({
      status: 'ok',
      message: 'Care rule created successfully',
      rule: newRule,
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        error: {
          code: 'rule_code_exists',
          message: `Rule code '${req.body.rule_code}' already exists`,
        },
      });
      return;
    }
    console.error('Failed to create care rule:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Failed to create care rule',
      },
    });
  }
}

export async function updateRuleHandler(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: { code: 'invalid_id', message: 'Rule ID must be a number' } });
    return;
  }

  const parseResult = UpdateCareRuleSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    res.status(400).json({
      error: {
        code: 'invalid_rule_data',
        message: errorDetails,
      },
    });
    return;
  }

  try {
    const updated = await careRuleService.updateRule(id, parseResult.data);
    if (!updated) {
      res.status(404).json({ error: { code: 'rule_not_found', message: `Rule #${id} not found` } });
      return;
    }

    res.status(200).json({
      status: 'ok',
      message: 'Care rule updated successfully',
      rule: updated,
    });
  } catch (err: any) {
    console.error('Failed to update care rule:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Failed to update care rule',
      },
    });
  }
}

export async function deleteRuleHandler(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: { code: 'invalid_id', message: 'Rule ID must be a number' } });
    return;
  }

  try {
    const deleted = await careRuleService.deleteRule(id);
    if (!deleted) {
      res.status(404).json({ error: { code: 'rule_not_found', message: `Rule #${id} not found` } });
      return;
    }

    res.status(200).json({
      status: 'ok',
      message: `Rule #${id} deleted successfully`,
    });
  } catch (err: any) {
    console.error('Failed to delete care rule:', err);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Failed to delete care rule',
      },
    });
  }
}
