#include "PlwStackMachine.h"
#include "PlwCommon.h"
#include "PlwOpcode.h"
#include "PlwAbstractRef.h"
#include "PlwExceptionHandlerRef.h"
#include "PlwMappedRecordRef.h"
#include "PlwBasicArrayRef.h"
#include "PlwArrayRef.h"
#include "PlwStringRef.h"
#include "PlwRecordRef.h"
#include <stdio.h>
#include <string.h>

const char * const PlwStackMachineErrorUnsuitableArch = "PlwStackMachineErrorUnsuitableArch";

void PlwStackMachineError_UnsuitableArch(PlwError *error) {
	error->code = PlwStackMachineErrorUnsuitableArch;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Unsuitable arch");
}

const char * const PlwStackMachineErrorStackAccessOutOfBound = "PlwStackMachineErrorStackAccessOutOfBound";

void PlwStackMachineError_StackAccessOutOfBound(PlwError *error) {
	error->code = PlwStackMachineErrorStackAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Stack access out of bound");
}

const char * const PlwStackMachineErrorCodeAccessOutOfBound = "PlwStackMachineErrorCodeAccessOutOfBound";

void PlwStackMachineError_CodeAccessOutOfBound(PlwError *error, char *codeBlockName, PlwInt offset) {
	error->code = PlwStackMachineErrorCodeAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Offset %ld of block %s out of bound", offset, codeBlockName);
}

const char * const PlwStackMachineErrorCodeBlockAccessOutOfBound = "PlwStackMachineErrorCodeBlockAccessOutOfBound";

void PlwStackMachineError_CodeBlockAccessOutOfBound(PlwError *error, PlwInt codeBlockId) {
	error->code = PlwStackMachineErrorCodeBlockAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Code block id %ld out of bound", codeBlockId);
}

const char * const PlwStackMachineErrorNativeAccessOutOfBound = "PlwStackMachineErrorNativeAccessOutOfBound";

void PlwStackMachineError_NativeAccessOutOfBound(PlwError *error, PlwInt nativeId) {
	error->code = PlwStackMachineErrorNativeAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Native id %ld out of bound", nativeId);
}

const char * const PlwStackMachineErrorInvalidFuncId = "PlwStackMachineErrorInvalidFuncId";

void PlwStackMachineError_InvalidFuncId(PlwError *error, PlwInt funcId, PlwRefId refId) {
	error->code = PlwStackMachineErrorInvalidFuncId;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Invalid func id %ld in ref id %ld", funcId, refId);
}

const char * const PlwStackMachineErrorSuspended = "PlwStackMachineErrorSuspended";

void PlwStackMachineError_Suspended(PlwError *error) {
	error->code = PlwStackMachineErrorSuspended;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Suspended");
}

const char * const PlwStackMachineErrorUnknownOp = "PlwStackMachineErrorUnknownOp";

void PlwStackMachineError_UnknownOp(PlwError *error, PlwInt code) {
	error->code = PlwStackMachineErrorUnknownOp;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Unknown opcode %ld", code);
}

const char * const PlwStackMachineErrorDivByZero = "PlwStackMachineErrorDivByZero";

void PlwStackMachineError_DivByZero(PlwError *error) {
	error->code = PlwStackMachineErrorDivByZero;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Division by zero");
}

const char * const PlwStackMachineErrorException = "PlwStackMachineErrorException";

void PlwStackMachineError_Exception(PlwError *error, PlwInt errorCode) {
	error->code = PlwStackMachineErrorException;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Exception %ld", errorCode);
}

const char * const PlwStackMachineErrorConstAccessOutOfBound = "PlwStackMachineErrorConstAccessOutOfBound";

void StackMachineError_ConstAccessOutOfBound(PlwError *error, PlwInt codeBlockId, PlwInt strId) {
	error->code = PlwStackMachineErrorConstAccessOutOfBound;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "String constant %ld in code block %ld does not exist", strId, codeBlockId);
}


PlwStackMachine *PlwStackMachine_Create(PlwError *error) {
	PlwStackMachine *sm;
	if (sizeof(PlwInt) != sizeof(PlwFloat)) {
		PlwStackMachineError_UnsuitableArch(error);
		return NULL;	
	}
	sm = PlwAlloc(sizeof(PlwStackMachine), error);
	if (PlwIsError(error)) {
		return NULL;
	}
	sm->stackSize = 1024;
	sm->stackMap = PlwAlloc(sm->stackSize * sizeof(PlwBoolean), error);
	if (PlwIsError(error)) {
		PlwFree(sm);
		return NULL;
	}
	sm->stack = PlwAlloc(sm->stackSize * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		PlwFree(sm->stackMap);
		PlwFree(sm);
		return NULL;
	}	
	sm->sp = 0;
	sm->bp = 0;
	sm->ip = 0;
	sm->refMan = PlwRefManager_Create(error);
	if (PlwIsError(error)) {
		PlwFree(sm->stackMap);
		PlwFree(sm->stack);
		PlwFree(sm);
		return NULL;
	}
	sm->codeBlockId = -1;
	sm->codeBlocks = NULL;
	sm->nativeCount = 0;
	sm->natives = NULL;
	return sm;
}

void PlwStackMachine_Destroy(PlwStackMachine *sm) {
	PlwFree(sm->stackMap);
	PlwFree(sm->stack);
	PlwRefManager_Destroy(sm->refMan);
	PlwFree(sm);
}

void PlwStackMachine_SetCodeBlocks(PlwStackMachine *sm, PlwInt codeBlockCount, PlwCodeBlock *codeBlocks) {
	sm->codeBlockCount = codeBlockCount;
	sm->codeBlocks = codeBlocks;
}


void PlwStackMachine_SetNatives(PlwStackMachine *sm, PlwInt nativeCount, const PlwNativeFunction *natives) {
	sm->nativeCount = nativeCount;
	sm->natives = natives;
}

PlwBoolean PlwStackMachine_RaiseError(PlwStackMachine *sm, PlwInt errorCode, PlwError *error) {
	PlwInt refId;
	PlwAbstractRef *ref;
	PlwExceptionHandlerRef *ehRef;
	while (sm->sp > 0) {
		if (sm->stackMap[sm->sp - 1]) {
			refId = sm->stack[sm->sp - 1];
			ref = PlwRefManager_GetRef(sm->refMan, refId, error);
			if (PlwIsError(error)) {
				return PlwFalse;
			}
			if (ref->tag->name == PlwExceptionHandlerRefTagName) {
				ehRef = (PlwExceptionHandlerRef *) ref;
				sm->bp = PlwExceptionHandlerRef_Bp(ehRef);
				sm->ip = PlwExceptionHandlerRef_Ip(ehRef);
				sm->codeBlockId = PlwExceptionHandlerRef_CodeBlockId(ehRef);
				PlwRefManager_DecRefCount(sm->refMan, refId, error);
				if (PlwIsError(error)) {
					return PlwFalse;
				}
				sm->stack[sm->sp - 1] = errorCode;
				sm->stackMap[sm->sp - 1] = PlwFalse;
				return PlwTrue;
			}
			PlwRefManager_DecRefCount(sm->refMan, refId, error);
			if (PlwIsError(error)) {
				return PlwFalse;
			}
		}
		sm->sp--;
	}
	return PlwFalse;
}


static void PlwStackMachine_GrowStack(PlwStackMachine *sm, PlwInt addedSize, PlwError *error) {
	if (sm->sp + addedSize > sm->stackSize) {
		if (addedSize < sm->stackSize) {
			addedSize = sm->stackSize;
		}
		sm->stackSize += addedSize;
		sm->stackMap = PlwRealloc(sm->stackMap, sm->stackSize * sizeof(PlwBoolean), error);
		if (PlwIsError(error)) {
			return;
		}
		sm->stack = PlwRealloc(sm->stack, sm->stackSize * sizeof(PlwInt), error);
		if (PlwIsError(error)) {
			return;
		}
	}
}

static void PlwStackMachine_OpcodeDup(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = sm->stack[sm->sp - 1];
	sm->stackMap[sm->sp] = sm->stackMap[sm->sp - 1];
	if (sm->stackMap[sm->sp]) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp++;
}

static void PlwStackMachine_OpcodeSwap(PlwStackMachine *sm, PlwError *error) {
	PlwInt tmp;
	PlwInt tmpMap;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	tmp = sm->stack[sm->sp - 2];
	tmpMap = sm->stackMap[sm->sp - 2];
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 1];
	sm->stackMap[sm->sp - 2] = sm->stackMap[sm->sp - 1];
	sm->stack[sm->sp - 1] = tmp;
	sm->stackMap[sm->sp - 1] = tmpMap;
}

static void PlwStackMachine_OpcodeAdd(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] += sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeAddf(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = (PlwInt)((PlwFloat)(sm->stack[sm->sp - 2]) + (PlwFloat)(sm->stack[sm->sp - 1]));
	sm->sp--;
}

static void PlwStackMachine_OpcodeSub(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] -= sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeSubf(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = (PlwInt)((PlwFloat)(sm->stack[sm->sp - 2]) - (PlwFloat)(sm->stack[sm->sp - 1]));
	sm->sp--;
}

static void PlwStackMachine_OpcodeDiv(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stack[sm->sp - 1] == 0) {
		if (!PlwStackMachine_RaiseError(sm, 0, error)) {
			if (PlwIsError(error)) {
				return;
			}
			PlwStackMachineError_DivByZero(error);
			return;
		}
	} else {
		sm->stack[sm->sp - 2] /= sm->stack[sm->sp - 1];
		sm->sp--;
	}
}

static void PlwStackMachine_OpcodeDivf(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = (PlwInt)((PlwFloat)(sm->stack[sm->sp - 2]) / (PlwFloat)(sm->stack[sm->sp - 1]));
	sm->sp--;
}

static void PlwStackMachine_OpcodeRem(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stack[sm->sp - 1] == 0) {
		if (!PlwStackMachine_RaiseError(sm, 0, error)) {
			if (PlwIsError(error)) {
				return;
			}
			PlwStackMachineError_DivByZero(error);
			return;
		}
	} else {
		sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] % sm->stack[sm->sp - 1];
		sm->sp--;
	}
}

static void PlwStackMachine_OpcodeMul(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] *= sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeMulf(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = (PlwInt)((PlwFloat)(sm->stack[sm->sp - 2]) * (PlwFloat)(sm->stack[sm->sp - 1]));
	sm->sp--;
}

static void PlwStackMachine_OpcodeNeg(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 1] = -sm->stack[sm->sp - 1];
}

static void PlwStackMachine_OpcodeNegf(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 1] = (PlwInt)(-(PlwFloat)(sm->stack[sm->sp - 1]));
}

static void PlwStackMachine_OpcodeGt(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] > sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeGtf(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = (PlwFloat)(sm->stack[sm->sp - 2]) > (PlwFloat)(sm->stack[sm->sp - 1]);
	sm->sp--;
}

static void PlwStackMachine_OpcodeLt(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] < sm->stack[sm->sp - 1];
	sm->sp--;	
}

static void PlwStackMachine_OpcodeLtf(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = (PlwFloat)(sm->stack[sm->sp - 2]) < (PlwFloat)(sm->stack[sm->sp - 1]);
	sm->sp--;
}

static void PlwStackMachine_OpcodeGte(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] >= sm->stack[sm->sp - 1];
	sm->sp--;	
}

static void PlwStackMachine_OpcodeGtef(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = (PlwFloat)(sm->stack[sm->sp - 2]) >= (PlwFloat)(sm->stack[sm->sp - 1]);
	sm->sp--;
}

static void PlwStackMachine_OpcodeLte(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] <= sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeLtef(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = (PlwFloat)(sm->stack[sm->sp - 2]) <= (PlwFloat)(sm->stack[sm->sp - 1]);
	sm->sp--;
}

static void PlwStackMachine_OpcodeAnd(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] && sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeOr(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] || sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeNot(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 1] = !sm->stack[sm->sp - 1];	
}

static void PlwStackMachine_OpcodeEq(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] == sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeEqf(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = (PlwFloat)(sm->stack[sm->sp - 2]) == (PlwFloat)(sm->stack[sm->sp - 1]);
	sm->sp--;
}

static void PlwStackMachine_OpcodeEqRef(PlwStackMachine *sm, PlwError *error) {
	PlwBoolean isEqual;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	isEqual = PlwRefManager_CompareRefs(sm->refMan, sm->stack[sm->sp - 2], sm->stack[sm->sp - 1], error);
	if (PlwIsError(error)) {
		return;
	}
	PlwRefManager_DecRefCount(sm->refMan, sm->stack[sm->sp - 2], error);
	if (PlwIsError(error)) {
		return;
	}
	PlwRefManager_DecRefCount(sm->refMan, sm->stack[sm->sp - 1], error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = isEqual;
	sm->sp--;	
}

static void PlwStackMachine_OpcodeNe(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = sm->stack[sm->sp - 2] != sm->stack[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodeNef(PlwStackMachine *sm, PlwError *error) {
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 2] = (PlwFloat)(sm->stack[sm->sp - 2]) != (PlwFloat)(sm->stack[sm->sp - 1]);
	sm->sp--;
}

static void PlwStackMachine_OpcodePushPtrOffset(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwInt offset;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->sp - 2];
	offset = sm->stack[sm->sp - 1];
	PlwRefManager_GetOffsetValue(sm->refMan, refId, offset, PlwFalse, error, &sm->offsetValue);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = sm->offsetValue.value;
	sm->stackMap[sm->sp - 2] = sm->offsetValue.isRef;
	if (sm->offsetValue.isRef) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp - 2], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp--;
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
}

static void PlwStackMachine_OpcodePushPtrOffsetForMutate(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwInt offset;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->sp - 2];
	offset = sm->stack[sm->sp - 1];
	PlwRefManager_GetOffsetValue(sm->refMan, refId, offset, PlwTrue, error, &sm->offsetValue);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = sm->offsetValue.value;
	sm->stackMap[sm->sp - 2] = sm->offsetValue.isRef;
	if (sm->offsetValue.isRef) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp - 2], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp--;
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
}

static void PlwStackMachine_OpcodePopPtrOffset(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwInt offset;
	PlwInt val;
	if (sm->sp < 3) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}				
	refId = sm->stack[sm->sp - 3];
	offset = sm->stack[sm->sp - 2];
	val = sm->stack[sm->sp - 1];
	PlwRefManager_SetOffsetValue(sm->refMan, refId, offset, val, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->sp -= 3;
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
}

static void PlwStackMachine_OpcodeRaise(PlwStackMachine *sm, PlwError *error) {
	PlwInt errorCode;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	errorCode = sm->stack[sm->sp - 1];
	if(!PlwStackMachine_RaiseError(sm,  errorCode, error)) {
		if (PlwIsError(error)) {
			return;
		}
		PlwStackMachineError_Exception(error, errorCode);
		return;
	}
}

static void PlwStackMachine_OpcodeRetVal(PlwStackMachine *sm, PlwError *error) {
	PlwInt retVal;
	PlwBoolean retValIsRef;
	PlwInt previousBp;
	PlwInt previousIp;
	PlwInt previousCodeBlockId;
	PlwInt argCount;
	PlwInt i;
	if (sm->bp < 4 || sm->bp > sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	retVal = sm->stack[sm->sp - 1];
	retValIsRef = sm->stackMap[sm->sp - 1];
	previousBp = sm->stack[sm->bp - 1];
	previousIp = sm->stack[sm->bp - 2];
	previousCodeBlockId = sm->stack[sm->bp - 3];
	argCount = sm->stack[sm->bp - 4];
	if (sm->bp < 4 + argCount) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	for (i = sm->sp - 2; i >= sm->bp - 4 - argCount; i--) {
		if (sm->stackMap[i]) {
			PlwRefManager_DecRefCount(sm->refMan, sm->stack[i], error);
			if (PlwIsError(error)) {
				return;
			}
		}
	}
	sm->sp = sm->bp - 3 - argCount;
	sm->stack[sm->sp - 1] = retVal;
	sm->stackMap[sm->sp - 1] = retValIsRef;
	sm->bp = previousBp;
	sm->codeBlockId = previousCodeBlockId;
	sm->ip = previousIp;
}

static void PlwStackMachine_OpcodeRet(PlwStackMachine *sm, PlwError *error) {
	PlwInt previousBp;
	PlwInt previousIp;
	PlwInt previousCodeBlockId;
	PlwInt argCount;
	PlwInt i;
	if (sm->bp < 4 || sm->bp > sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	previousBp = sm->stack[sm->bp - 1];
	previousIp = sm->stack[sm->bp - 2];
	previousCodeBlockId = sm->stack[sm->bp - 3];
	argCount = sm->stack[sm->bp - 4];
	if (sm->bp < 4 + argCount) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	for (i = sm->sp - 1; i >= sm->bp - 4 - argCount; i--) {
		if (sm->stackMap[i]) {
			PlwRefManager_DecRefCount(sm->refMan, sm->stack[i], error);
			if (PlwIsError(error)) {
				return;
			}
		}
	}
	sm->sp = sm->bp - 4 - argCount;
	sm->bp = previousBp;
	sm->codeBlockId = previousCodeBlockId;
	sm->ip = previousIp;
}

static void PlwStackMachine_OpcodeYield(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwMappedRecordRef *ref;
	PlwInt i;
	PlwInt retVal;
	PlwBoolean retValIsRef;
	PlwInt previousBp;
	PlwInt previousIp;
	PlwInt previousCodeBlockId;
	PlwInt *refPtr;
	PlwBoolean *refMapPtr;
	if (sm->bp < 4 || sm->bp >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->bp - 4];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwMappedRecordRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwMappedRecordRef_Resize(ref, 1 + (sm->sp - sm->bp), error);
	if (PlwIsError(error)) {
		return;
	}
	refPtr = PlwMappedRecordRef_Ptr(ref);
	refMapPtr = PlwMappedRecordRef_MapPtr(ref);
	refPtr[1] = sm->ip;
	for (i = 0; i < sm->sp - sm->bp - 1; i++) {
		refPtr[i + 2] = sm->stack[sm->bp + i];
		refMapPtr[i + 2] = sm->stackMap[sm->bp + i];
	}
	retVal = sm->stack[sm->sp - 1];
	retValIsRef = sm->stackMap[sm->sp - 1];
	previousBp = sm->stack[sm->bp - 1];
	previousIp = sm->stack[sm->bp - 2];
	previousCodeBlockId = sm->stack[sm->bp - 3];
	sm->sp = sm->bp - 3;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	sm->stack[sm->sp - 1] = retVal;
	sm->stackMap[sm->sp - 1] = retValIsRef;
	sm->bp = previousBp;
	sm->codeBlockId = previousCodeBlockId;
	sm->ip = previousIp;
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
}

static void PlwStackMachine_OpcodeYieldDone(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwMappedRecordRef *ref;
	PlwInt previousBp;
	PlwInt previousIp;
	PlwInt previousCodeBlockId;
	PlwInt i;
	if (sm->bp < 4 || sm->bp > sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->bp - 4];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwMappedRecordRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwMappedRecordRef_Resize(ref, 2, error);
	if (PlwIsError(error)) {
		return;
	}
	PlwMappedRecordRef_Ptr(ref)[1] = sm->ip;
	previousBp = sm->stack[sm->bp - 1];
	previousIp = sm->stack[sm->bp - 2];
	previousCodeBlockId = sm->stack[sm->bp - 3];
	for (i = sm->sp - 1; i >= sm->bp - 4; i --) {
		if (sm->stackMap[i]) {
			PlwRefManager_DecRefCount(sm->refMan, sm->stack[i], error);
			if (PlwIsError(error)) {
				return;
			}
		}
	}
	sm->sp = sm->bp - 3;
	sm->stack[sm->sp - 1] = 0;
	sm->stackMap[sm->sp - 1] = PlwFalse;
	sm->bp = previousBp;
	sm->codeBlockId = previousCodeBlockId;
	sm->ip = previousIp;	
}

static void PlwStackMachine_OpcodeNext(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwMappedRecordRef *ref;
	PlwInt refSize;
	PlwInt *refPtr;
	PlwBoolean *refMapPtr;
	PlwInt i;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->sp - 1];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwMappedRecordRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	refSize = PlwMappedRecordRef_Size(ref);
	refPtr = PlwMappedRecordRef_Ptr(ref);
	refMapPtr = PlwMappedRecordRef_MapPtr(ref);
	PlwStackMachine_GrowStack(sm, 1 + refSize, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = sm->codeBlockId;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
	sm->stack[sm->sp] = sm->ip;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
	sm->stack[sm->sp] = sm->bp;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
	sm->bp = sm->sp;
	for (i = 0; i < refSize - 2; i++) {
		sm->stack[sm->sp] = refPtr[i + 2];
		sm->stackMap[sm->sp] = refMapPtr[i + 2];
		refMapPtr[i + 2] = PlwFalse;
		sm->sp++;
	}
	sm->codeBlockId = refPtr[0];
	sm->ip = refPtr[1];
}

static void PlwStackMachine_OpcodeEnded(PlwStackMachine *sm, PlwError *error) {
	PlwRefId refId;
	PlwMappedRecordRef *ref;
	PlwInt *refPtr;
	PlwBoolean ended;
	const PlwCodeBlock *codeBlock;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	refId = sm->stack[sm->sp - 1];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwMappedRecordRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	refPtr = PlwMappedRecordRef_Ptr(ref);
	codeBlock = &sm->codeBlocks[refPtr[0]];
	ended = refPtr[1] >= codeBlock->codeCount;
	PlwRefManager_DecRefCount(sm->refMan, sm->stack[sm->sp - 1], error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 1] = ended;
}

static void PlwStackMachine_OpcodeBasicArrayTimes(PlwStackMachine *sm, PlwError *error) {
	PlwInt val;
	PlwInt count;
	PlwInt *ptr;
	PlwInt i;
	PlwRefId refId;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	val = sm->stack[sm->sp - 2];
	count = sm->stack[sm->sp - 1];
	if (count < 0) {
		count = 0;
	}
	ptr = PlwAlloc(count * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return;
	}
	for (i = 0; i < count; i++) {
		ptr[i] = val;
	}
	refId = PlwBasicArrayRef_Make(sm->refMan, count, ptr, error);
	if (PlwIsError(error)) {
		PlwFree(ptr);
		return;
	}
	sm->stack[sm->sp - 2] = refId;
	sm->stackMap[sm->sp - 2] = PlwTrue;
	sm->sp--;
}

static void PlwStackMachine_OpcodeArrayTimes(PlwStackMachine *sm, PlwError *error) {
	PlwRefId val;
	PlwInt count;
	PlwRefId *ptr;
	PlwInt i;
	PlwRefId refId;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	val = sm->stack[sm->sp - 2];
	count = sm->stack[sm->sp - 1];
	if (count < 0) {
		count = 0;
	}
	ptr = PlwAlloc(count * sizeof(PlwRefId), error);
	if (PlwIsError(error)) {
		return;
	}
	for (i = 0; i < count; i++) {
		ptr[i] = val;
	}
	refId = PlwArrayRef_Make(sm->refMan, count, ptr, error);
	if (PlwIsError(error)) {
		PlwFree(ptr);
		return;
	}	
	if (count == 0) {
		PlwRefManager_DecRefCount(sm->refMan, val, error);
	} else {
		PlwRefManager_AddRefCount(sm->refMan, val, count - 1, error);
	}
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = refId;
	sm->stackMap[sm->sp - 2] = PlwTrue;
	sm->sp--;
}

static void PlwStackMachine_OpcodeJz(PlwStackMachine *sm, PlwInt arg1, PlwError *error) {
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stack[sm->sp - 1] == 0) {
		sm->ip = arg1;
	}
	sm->sp--;
}

static void PlwStackMachine_OpcodeJnz(PlwStackMachine *sm, PlwInt arg1, PlwError *error) {
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stack[sm->sp - 1] != 0) {
		sm->ip = arg1;
	}
	sm->sp--;
}

static void PlwStackMachine_OpcodeJmp(PlwStackMachine *sm, PlwInt arg1, PlwError *error) {
	sm->ip = arg1;
}

static void PlwStackMachine_OpcodePush(PlwStackMachine *sm, PlwInt arg1, PlwError *error) {
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = arg1;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
}

static void PlwStackMachine_OpcodePushGlobal(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (offset < 0 || offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = sm->stack[offset];
	sm->stackMap[sm->sp] = sm->stackMap[offset];
	if (sm->stackMap[sm->sp]) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp++;
}

static void PlwStackMachine_OpcodePushGlobalForMutate(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (offset < 0 || offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[offset] = PlwRefManager_MakeMutable(sm->refMan, sm->stack[offset], error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stackMap[offset] = PlwTrue;
	sm->stack[sm->sp] = sm->stack[offset];
	sm->stackMap[sm->sp] = sm->stackMap[offset];
	if (sm->stackMap[sm->sp]) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp++;
}

static void PlwStackMachine_OpcodePushLocal(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (sm->bp + offset < 0 || sm->bp + offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = sm->stack[sm->bp + offset];
	sm->stackMap[sm->sp] = sm->stackMap[sm->bp + offset];
	if (sm->stackMap[sm->sp]) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp++;
}

static void PlwStackMachine_OpcodePushLocalForMutate(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (sm->bp + offset < 0 || sm->bp + offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->bp + offset] = PlwRefManager_MakeMutable(sm->refMan, sm->stack[sm->bp + offset], error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stackMap[sm->bp + offset] = PlwTrue;
	sm->stack[sm->sp] = sm->stack[sm->bp + offset];
	sm->stackMap[sm->sp] = sm->stackMap[sm->bp + offset];
	if (sm->stackMap[sm->sp]) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp++;
}

static void PlwStackMachine_OpcodePushIndirection(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = sm->bp + offset;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
}

static void PlwStackMachine_OpcodePushIndirect(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	PlwInt directOffset;
	if (sm->bp + offset < 0 || sm->bp + offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	directOffset = sm->stack[sm->bp + offset];
	if (directOffset < 0 || directOffset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}		
	sm->stack[sm->sp] = sm->stack[directOffset];
	sm->stackMap[sm->sp] = sm->stackMap[directOffset];
	if (sm->stackMap[sm->sp]) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp++;
}

static void PlwStackMachine_OpcodePushIndirectForMutate(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	PlwInt directOffset;
	if (sm->bp + offset < 0 || sm->bp + offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	directOffset = sm->stack[sm->bp + offset];
	if (directOffset < 0 || directOffset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}		
	sm->stack[directOffset] = PlwRefManager_MakeMutable(sm->refMan, sm->stack[directOffset], error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stackMap[directOffset] = PlwTrue;
	sm->stack[sm->sp] = sm->stack[directOffset];
	sm->stackMap[sm->sp] = sm->stackMap[directOffset];
	if (sm->stackMap[sm->sp]) {
		PlwRefManager_IncRefCount(sm->refMan, sm->stack[sm->sp], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->sp++;

}

static void PlwStackMachine_OpcodePopGlobal(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (sm->sp < 1 || offset < 0 || offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stackMap[offset]) {
		PlwRefManager_DecRefCount(sm->refMan, sm->stack[offset], error);
		if (PlwIsError(error)) {
			return;
		}						
	}
	sm->stack[offset] = sm->stack[sm->sp - 1];
	sm->stackMap[offset] = sm->stackMap[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodePopLocal(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	if (sm->sp < 1 || sm->bp + offset < 0 || sm->bp + offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stackMap[sm->bp + offset]) {
		PlwRefManager_DecRefCount(sm->refMan, sm->stack[sm->bp + offset], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->stack[sm->bp + offset] = sm->stack[sm->sp - 1];
	sm->stackMap[sm->bp + offset] = sm->stackMap[sm->sp - 1];
	sm->sp--;
}

static void PlwStackMachine_OpcodePopIndirect(PlwStackMachine *sm, PlwInt offset, PlwError *error) {
	PlwInt directOffset;
	if (sm->sp < 1 || sm->bp + offset < 0 || sm->bp + offset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	directOffset = sm->stack[sm->bp + offset];
	if (directOffset < 0 || directOffset >= sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	if (sm->stackMap[directOffset]) {
		PlwRefManager_DecRefCount(sm->refMan, sm->stack[directOffset], error);
		if (PlwIsError(error)) {
			return;
		}
	}
	sm->stack[directOffset] = sm->stack[sm->sp - 1];
	sm->stackMap[directOffset] = sm->stackMap[sm->sp - 1];
	sm->sp--;

}

static void PlwStackMachine_OpcodePopVoid(PlwStackMachine *sm, PlwInt cellCount, PlwError *error) {
	PlwInt i;
	if (cellCount < 0 || cellCount > sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;
	}
	for (i = sm->sp - 1; i >= sm->sp - cellCount; i--) {
		if (sm->stackMap[i]) {
			PlwRefManager_DecRefCount(sm->refMan, sm->stack[i], error);
			if (PlwIsError(error)) {
				return;
			}
		}
	}
	sm->sp -= cellCount;	
}

static void PlwStackMachine_OpcodeCreateString(PlwStackMachine *sm, PlwInt strId, PlwError *error) {
	const PlwCodeBlock *codeBlock = &sm->codeBlocks[sm->codeBlockId];
	char *ptr;
	if (strId < 0 || strId >= codeBlock->strConstCount) {
		StackMachineError_ConstAccessOutOfBound(error, sm->codeBlockId, strId);
		return;				
	}
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	ptr = PlwStrDup(codeBlock->strConsts[strId], error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = PlwStringRef_Make(sm->refMan, ptr, error);
	if (PlwIsError(error)) {
		PlwFree(ptr);
		return;
	}
	sm->stackMap[sm->sp] = PlwTrue;
	sm->sp++;	
}

static void PlwStackMachine_OpcodeCreateRecord(PlwStackMachine *sm, PlwInt cellCount, PlwError *error) {
	PlwInt *ptr;
	PlwInt offset;
	PlwInt i;
	PlwInt refSize;
	PlwRefId refId;
	if (cellCount < 0 || cellCount > sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;				
	}
	ptr = PlwAlloc(cellCount * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return;
	}	
	offset = 0;
	for (i = 0; i < cellCount; i++) {
		if (sm->stackMap[sm->sp - cellCount + i]) {
			ptr[offset] = sm->stack[sm->sp - cellCount + i];
			offset++;
		}
	}
	refSize = offset;
	if (refSize != cellCount) {
		for (i = 0; i < cellCount; i++) {
			if (!sm->stackMap[sm->sp - cellCount + i]) {
				ptr[offset] = sm->stack[sm->sp - cellCount + i];
				offset++;
			}
		}
	}
	refId = PlwRecordRef_Make(sm->refMan, refSize, cellCount, ptr, error);
	if (PlwIsError(error)) {
		PlwFree(ptr);
		return;
	}	
	sm->sp = sm->sp - cellCount + 1;
	sm->stack[sm->sp - 1] = refId; 
	sm->stackMap[sm->sp - 1] = PlwTrue;
}

static void PlwStackMachine_OpcodeCreateBasicArray(PlwStackMachine *sm, PlwInt cellCount, PlwError *error) {
	PlwInt *ptr;
	PlwRefId refId;
	if (cellCount < 0 || cellCount > sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;				
	}
	ptr = PlwAlloc(cellCount * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return;
	}
	memcpy(ptr, sm->stack + sm->sp - cellCount, cellCount * sizeof(PlwInt));
	refId = PlwBasicArrayRef_Make(sm->refMan, cellCount, ptr, error);
	if (PlwIsError(error)) {
		PlwFree(ptr);
		return;
	}
	sm->sp = sm->sp - cellCount + 1;
	sm->stack[sm->sp - 1] = refId; 
	sm->stackMap[sm->sp - 1] = PlwTrue;
}

static void PlwStackMachine_OpcodeCreateArray(PlwStackMachine *sm, PlwInt cellCount, PlwError *error) {
	PlwInt *ptr;
	PlwRefId refId;
	if (cellCount < 0 || cellCount > sm->sp) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;				
	}
	ptr = PlwAlloc(cellCount * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return;
	}
	memcpy(ptr, sm->stack + sm->sp - cellCount, cellCount * sizeof(PlwInt));
	refId = PlwArrayRef_Make(sm->refMan, cellCount, ptr, error);
	if (PlwIsError(error)) {
		PlwFree(ptr);
		return;
	}
	sm->sp = sm->sp - cellCount + 1;
	sm->stack[sm->sp - 1] = refId; 
	sm->stackMap[sm->sp - 1] = PlwTrue;
}

static void PlwStackMachine_OpcodeCall(PlwStackMachine *sm, PlwInt arg1, PlwError *error) {
	if (arg1 < 0 || arg1 > sm->codeBlockCount) {
		PlwStackMachineError_CodeBlockAccessOutOfBound(error, arg1);
		return;
	}
	PlwStackMachine_GrowStack(sm, 3, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = sm->codeBlockId;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
	sm->stack[sm->sp] = sm->ip;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;					
	sm->stack[sm->sp] = sm->bp;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
	sm->bp = sm->sp;
	sm->codeBlockId = arg1;
	sm->ip = 0;	
}

static void PlwStackMachine_OpcodeCallAbstract(PlwStackMachine *sm, PlwInt funcId, PlwError *error) {
	PlwRefId refId;
	PlwRecordRef *ref;
	PlwInt codeBlockId;
	PlwBoolean concreteIsRef;
	PlwInt concreteVal;
	if (sm->sp < 2) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;				
	}
	PlwStackMachine_GrowStack(sm, 3, error);
	if (PlwIsError(error)) {
		return;
	}
	refId = sm->stack[sm->sp - 2];
	ref = PlwRefManager_GetRefOfType(sm->refMan, refId, PlwRecordRefTagName, error);
	if (PlwIsError(error)) {
		return;
	}
	if (funcId < 0 || (1 + 2 * funcId) >= PlwRecordRef_TotalSize(ref)) {
		PlwStackMachineError_InvalidFuncId(error, funcId, refId);
		return;
	}
	codeBlockId =  PlwRecordRef_Ptr(ref)[1 + 2 * funcId];
	if (codeBlockId < 0 || codeBlockId > sm->codeBlockCount) {
		PlwStackMachineError_CodeBlockAccessOutOfBound(error, codeBlockId);
		return;
	}
	concreteVal = PlwRecordRef_Ptr(ref)[0];
	concreteIsRef = PlwFalse;
	if (PlwRecordRef_RefSize(ref) > 0) {
		concreteIsRef = PlwTrue;
		PlwRefManager_IncRefCount(sm->refMan, concreteVal, error);
		if (PlwIsError(error)) {
			return;
		}
	}
	PlwRefManager_DecRefCount(sm->refMan, refId, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp - 2] = concreteVal;
	sm->stackMap[sm->sp - 2] = concreteIsRef;
	sm->stack[sm->sp] = sm->codeBlockId;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
	sm->stack[sm->sp] = sm->ip;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;					
	sm->stack[sm->sp] = sm->bp;
	sm->stackMap[sm->sp] = PlwFalse;
	sm->sp++;
	sm->bp = sm->sp;
	sm->codeBlockId = codeBlockId;
	sm->ip = 0;
}

static void PlwStackMachine_OpcodeCallNative(PlwStackMachine *sm, PlwInt nativeId, PlwError *error) {
	if (nativeId < 0 || nativeId >= sm->nativeCount) {
		PlwStackMachineError_NativeAccessOutOfBound(error, nativeId);
		return;
	}
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;				
	}
	if (sm->sp < sm->stack[sm->sp - 1]) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;				
	}
	((PlwNativeFunction)(sm->natives[nativeId]))(sm, error);
}

static void PlwStackMachine_OpcodeInitGenerator(PlwStackMachine *sm, PlwInt codeBlockId, PlwError *error) {
	PlwInt nbParam;
	PlwInt *ptr;
	PlwBoolean *mapPtr;
	PlwInt i;
	PlwRefId refId;
	if (sm->sp < 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;				
	}
	if (codeBlockId < 0 || codeBlockId > sm->codeBlockCount) {
		PlwStackMachineError_CodeBlockAccessOutOfBound(error, codeBlockId);
		return;
	}
	nbParam = sm->stack[sm->sp - 1];
	if (nbParam < 0 || sm->sp < nbParam + 1) {
		PlwStackMachineError_StackAccessOutOfBound(error);
		return;				
	}					
	ptr = PlwAlloc((nbParam + 2) * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		return;
	}
	mapPtr = PlwAlloc((nbParam + 2) * sizeof(PlwBoolean), error);
	if (PlwIsError(error)) {
		PlwFree(ptr);
		return;
	}
	ptr[0] = codeBlockId;
	ptr[1] = 0;
	mapPtr[0] = PlwFalse;
	mapPtr[1] = PlwFalse;
	for (i = 0; i < nbParam; i++) {
		ptr[i + 2] = sm->stack[sm->sp - nbParam - 1 + i];
		mapPtr[i + 2] = sm->stackMap[sm->sp - nbParam - 1 + i];
	}
	refId = PlwMappedRecordRef_Make(sm->refMan, nbParam + 2, ptr, mapPtr, error);
	if (PlwIsError(error)) {
		PlwFree(mapPtr);
		PlwFree(ptr);
		return;
	}
	sm->stack[sm->sp - nbParam - 1] = refId;
	sm->stackMap[sm->sp - nbParam - 1] = PlwTrue;
	sm->sp -= nbParam;
}

static void PlwStackMachine_OpcodeCreateExceptionHandler(PlwStackMachine *sm, PlwInt arg1, PlwError *error) {
	PlwStackMachine_GrowStack(sm, 1, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stack[sm->sp] = PlwExceptionHandlerRef_Make(sm->refMan, sm->codeBlockId, arg1, sm->bp, error);
	if (PlwIsError(error)) {
		return;
	}
	sm->stackMap[sm->sp] = PlwTrue;
	sm->sp++;
}

static void PlwStackMachine_Opcode1(PlwStackMachine *sm, PlwInt code, PlwError *error) {
	switch(code) {
	case PLW_OPCODE_SUSPEND:
		PlwStackMachineError_Suspended(error);
		break;
	case PLW_OPCODE_DUP:
		PlwStackMachine_OpcodeDup(sm, error);
		break;
	case PLW_OPCODE_SWAP:
		PlwStackMachine_OpcodeSwap(sm, error);
		break;
	case PLW_OPCODE_ADD:
		PlwStackMachine_OpcodeAdd(sm, error);
		break;
	case PLW_OPCODE_ADDF:
		PlwStackMachine_OpcodeAddf(sm, error);
		break;
	case PLW_OPCODE_SUB:
		PlwStackMachine_OpcodeSub(sm, error);
		break;
	case PLW_OPCODE_SUBF:
		PlwStackMachine_OpcodeSubf(sm, error);
		break;
	case PLW_OPCODE_DIV:
		PlwStackMachine_OpcodeDiv(sm, error);
		break;
	case PLW_OPCODE_DIVF:
		PlwStackMachine_OpcodeDivf(sm, error);
		break;
	case PLW_OPCODE_REM:
		PlwStackMachine_OpcodeRem(sm, error);
		break;
	case PLW_OPCODE_MUL:
		PlwStackMachine_OpcodeMul(sm, error);
		break;
	case PLW_OPCODE_MULF:
		PlwStackMachine_OpcodeMulf(sm, error);
		break;
	case PLW_OPCODE_NEG:
		PlwStackMachine_OpcodeNeg(sm, error);
		break;
	case PLW_OPCODE_NEGF:
		PlwStackMachine_OpcodeNegf(sm, error);
		break;
	case PLW_OPCODE_GT:
		PlwStackMachine_OpcodeGt(sm, error);
		break;
	case PLW_OPCODE_GTF:
		PlwStackMachine_OpcodeGtf(sm, error);
		break;
	case PLW_OPCODE_LT:
		PlwStackMachine_OpcodeLt(sm, error);
		break;
	case PLW_OPCODE_LTF:
		PlwStackMachine_OpcodeLtf(sm, error);
		break;
	case PLW_OPCODE_GTE:
		PlwStackMachine_OpcodeGte(sm, error);
		break;
	case PLW_OPCODE_GTEF:
		PlwStackMachine_OpcodeGtef(sm, error);
		break;
	case PLW_OPCODE_LTE:
		PlwStackMachine_OpcodeLte(sm, error);
		break;
	case PLW_OPCODE_LTEF:
		PlwStackMachine_OpcodeLtef(sm, error);
		break;
	case PLW_OPCODE_AND:
		PlwStackMachine_OpcodeAnd(sm, error);
		break;
	case PLW_OPCODE_OR:
		PlwStackMachine_OpcodeOr(sm, error);
		break;
	case PLW_OPCODE_NOT:
		PlwStackMachine_OpcodeNot(sm, error);
		break;
	case PLW_OPCODE_EQ:
		PlwStackMachine_OpcodeEq(sm, error);
		break;
	case PLW_OPCODE_EQF:
		PlwStackMachine_OpcodeEqf(sm, error);
		break;
	case PLW_OPCODE_EQ_REF:
		PlwStackMachine_OpcodeEqRef(sm, error);
		break;
	case PLW_OPCODE_NE:
		PlwStackMachine_OpcodeNe(sm, error);
		break;
	case PLW_OPCODE_NEF:
		PlwStackMachine_OpcodeNef(sm, error);
		break;
	case PLW_OPCODE_PUSH_PTR_OFFSET:
		PlwStackMachine_OpcodePushPtrOffset(sm, error);
		break;
	case PLW_OPCODE_PUSH_PTR_OFFSET_FOR_MUTATE:
		PlwStackMachine_OpcodePushPtrOffsetForMutate(sm, error);
		break;
	case PLW_OPCODE_POP_PTR_OFFSET:
		PlwStackMachine_OpcodePopPtrOffset(sm, error);
		break;
	case PLW_OPCODE_RAISE:
		PlwStackMachine_OpcodeRaise(sm, error);
		break;
	case PLW_OPCODE_RET_VAL:
		PlwStackMachine_OpcodeRetVal(sm, error);
		break;
	case PLW_OPCODE_RET:
		PlwStackMachine_OpcodeRet(sm, error);
		break;
	case PLW_OPCODE_YIELD:
		PlwStackMachine_OpcodeYield(sm, error);
		break;
	case PLW_OPCODE_YIELD_DONE:
		PlwStackMachine_OpcodeYieldDone(sm, error);
		break;
	case PLW_OPCODE_NEXT:
		PlwStackMachine_OpcodeNext(sm, error);
		break;
	case PLW_OPCODE_ENDED:
		PlwStackMachine_OpcodeEnded(sm, error);
		break;
	case PLW_OPCODE_BASIC_ARRAY_TIMES:
		PlwStackMachine_OpcodeBasicArrayTimes(sm, error);
		break;
	case PLW_OPCODE_ARRAY_TIMES:
		PlwStackMachine_OpcodeArrayTimes(sm, error);
		break;
	default:
		PlwStackMachineError_UnknownOp(error, code);
	}
}

static void PlwStackMachine_Opcode2(PlwStackMachine *sm, PlwInt code, PlwInt arg1, PlwError *error) {
	switch(code) {
	case PLW_OPCODE_JZ:
		PlwStackMachine_OpcodeJz(sm, arg1, error);
		break;
	case PLW_OPCODE_JNZ:
		PlwStackMachine_OpcodeJnz(sm, arg1, error);
		break;
	case PLW_OPCODE_JMP:
		PlwStackMachine_OpcodeJmp(sm, arg1, error);
		break;
	case PLW_OPCODE_PUSH:
		PlwStackMachine_OpcodePush(sm, arg1, error);
		break;
	case PLW_OPCODE_PUSH_GLOBAL:
		PlwStackMachine_OpcodePushGlobal(sm, arg1, error);
		break;
	case PLW_OPCODE_PUSH_GLOBAL_FOR_MUTATE:
		PlwStackMachine_OpcodePushGlobalForMutate(sm, arg1, error);
		break;
	case PLW_OPCODE_PUSH_LOCAL:
		PlwStackMachine_OpcodePushLocal(sm, arg1, error);
		break;
	case PLW_OPCODE_PUSH_LOCAL_FOR_MUTATE:
		PlwStackMachine_OpcodePushLocalForMutate(sm, arg1, error);
		break;
	case PLW_OPCODE_PUSH_INDIRECTION:
		PlwStackMachine_OpcodePushIndirection(sm, arg1, error);
		break;
	case PLW_OPCODE_PUSH_INDIRECT:
		PlwStackMachine_OpcodePushIndirect(sm, arg1, error);
		break;
	case PLW_OPCODE_PUSH_INDIRECT_FOR_MUTATE:
		PlwStackMachine_OpcodePushIndirectForMutate(sm, arg1, error);
		break;
	case PLW_OPCODE_POP_GLOBAL:
		PlwStackMachine_OpcodePopGlobal(sm, arg1, error);
		break;
	case PLW_OPCODE_POP_LOCAL:
		PlwStackMachine_OpcodePopLocal(sm, arg1, error);
		break;
	case PLW_OPCODE_POP_INDIRECT:
		PlwStackMachine_OpcodePopIndirect(sm, arg1, error);
		break;
	case PLW_OPCODE_POP_VOID:
		PlwStackMachine_OpcodePopVoid(sm, arg1, error);
		break;
	case PLW_OPCODE_CREATE_STRING:
		PlwStackMachine_OpcodeCreateString(sm, arg1, error);
		break;
	case PLW_OPCODE_CREATE_RECORD:
		PlwStackMachine_OpcodeCreateRecord(sm, arg1, error);
		break;
	case PLW_OPCODE_CREATE_BASIC_ARRAY:
		PlwStackMachine_OpcodeCreateBasicArray(sm, arg1, error);
		break;
	case PLW_OPCODE_CREATE_ARRAY:
		PlwStackMachine_OpcodeCreateArray(sm, arg1, error);
		break;
	case PLW_OPCODE_CALL:
		PlwStackMachine_OpcodeCall(sm, arg1, error);
		break;
	case PLW_OPCODE_CALL_ABSTRACT:
		PlwStackMachine_OpcodeCallAbstract(sm, arg1, error);
		break;
	case PLW_OPCODE_CALL_NATIVE:
		PlwStackMachine_OpcodeCallNative(sm, arg1, error);
		break;
	case PLW_OPCODE_INIT_GENERATOR:
		PlwStackMachine_OpcodeInitGenerator(sm, arg1, error);
		break;
	case PLW_OPCODE_CREATE_EXCEPTION_HANDLER:
		PlwStackMachine_OpcodeCreateExceptionHandler(sm, arg1, error);
		break;
	default:
		PlwStackMachineError_UnknownOp(error, code);
	}
}

static void PlwStackMachine_RunLoop(PlwStackMachine *sm, PlwError *error) {
	PlwInt code;
	PlwInt arg1;
	const PlwCodeBlock *codeBlock;
	for (;;) {
		codeBlock = &sm->codeBlocks[sm->codeBlockId];
		if (sm->ip >= codeBlock->codeCount) {
			break;
		}
		code = codeBlock->codes[sm->ip];
		sm->ip++;
		if (code <= PLW_OPCODE1_MAX) {
#ifdef PLW_DEBUG_SM
			printf("sp: %ld, bp: %ld, cs: %ld, ip: %ld nbrefs: %ld   %s\n", sm->sp, sm->bp, sm->codeBlockId, sm->ip - 1, PlwRefManager_RefCount(sm->refMan), PlwOpcodes[code]);
#endif
			PlwStackMachine_Opcode1(sm, code, error);
			if (PlwIsError(error)) {
				return;
			}
		} else {
			if (sm->ip >= codeBlock->codeCount) {
				PlwStackMachineError_CodeAccessOutOfBound(error, codeBlock->name, sm->ip);
				return;
			}
			arg1 = codeBlock->codes[sm->ip];
			sm->ip++;
#ifdef PLW_DEBUG_SM
			printf("sp: %ld, bp: %ld, cs: %ld, ip: %ld nbrefs: %ld   %s %ld\n", sm->sp, sm->bp, sm->codeBlockId, sm->ip - 2, PlwRefManager_RefCount(sm->refMan), PlwOpcodes[code], arg1);
#endif
			PlwStackMachine_Opcode2(sm, code, arg1, error);
			if (PlwIsError(error)) {
				return;
			}
		}
	}
}

void PlwStackMachine_Execute(PlwStackMachine *sm, PlwInt codeBlockId, PlwError *error) {
	sm->ip = 0;
	sm->codeBlockId = codeBlockId;
	PlwStackMachine_RunLoop(sm, error);
}

