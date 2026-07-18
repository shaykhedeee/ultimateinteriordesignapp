import type { ScenePatchRequestDto } from '@studio/contracts';

export function createUpdateModuleParamsPatch(moduleId: string, params: Record<string, unknown>, reason = 'Update module parameters'): ScenePatchRequestDto {
  return {
    reason,
    operations: [
      {
        op: 'update_module_params',
        moduleId,
        params,
      },
    ],
  };
}

export function createAssignMaterialPatch(moduleId: string, payload: Record<string, unknown>, reason = 'Assign material'): ScenePatchRequestDto {
  return {
    reason,
    operations: [
      {
        op: 'assign_material',
        moduleId,
        payload,
      },
    ],
  };
}

export function createRemoveModulePatch(moduleId: string, reason = 'Remove module'): ScenePatchRequestDto {
  return {
    reason,
    operations: [
      {
        op: 'remove_module',
        moduleId,
      },
    ],
  };
}
