"use strict";
/******************************************************************************************************************************************

	StackMachine
	
	Execute pcode
	
	The SM should not not read or write to memory it doesn't own, even if feed with bogus code.
	There is no guarantee to not leak memory if code is bogus 
	
	
	Stack Frame:
		arg1				<- BP - 4 - argCount 
		...
		argN				<- BP - 5
		argCount			<- BP - 4
		retCodeBlockId		<- BP - 3
		retIP				<- BP - 2
		oldBP				<- BP - 1
		local1				<- BP
		
******************************************************************************************************************************************/



class StackMachineError {

	constructor(errorMsg) {
		this.currentBlockId = -1;
		this.ip = 0;
		this.errorMsg = errorMsg;
		this.refManError = null;
	}
	
	fromCode(currentBlockId, ip) {
		this.currentBlockId = currentBlockId;
		this.ip = ip;
		return this;
	}
	
	static trap(trapName) {
		return new StackMachineError(trapName);
	}
	
	static suspended() {
		return new StackMachineError("suspended");
	}
		
	static stackAccessOutOfBound() {
		return new StackMachineError("stack access out of bound");
	}
	
	static codeAccessOutOfBound() {
		return new StackMachineError("code access out of bound");
	}
	
	static constAccessOutOfBound() {
		return new StackMachineError("const access out of bound");
	}
	
	static invalidRefType() {
		return new StackMachineError("invalid ref type");
	}
	
	static refAccessOutOfBound() {
		return new StackMachineError("ref access out of bound");
	}
	
	static invalidSize() {
		return new StackMachineError("invalid size");
	}
	
	static divByZero() {
		return new StackMachineError("div by zero");
	}
	
	static referenceManagerError(refManError) {
		let error = new StackMachineError("refman error");
		error.refManError = refManError;
		return error;
	}
	
	static unknownOp() {
		return new StackMachineError("unknown op");
	}
	
	static nativeArgCountMismatch() {
		return new StackMachineError("wrong number of arguments provided to a native call");
	}
	
	static exception(errorCode) {
		return new StackMachineError("Uncaught exception " + errorCode);
	}
}

let PLW_NOARG_OPS = [];

PLW_NOARG_OPS[OPCODE_SUSPEND] = function(sm) {
	return StackMachineError.suspended().fromCode(sm.codeBlockId, sm.ip);
}

PLW_NOARG_OPS[OPCODE_DIV] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let divisor = sm.stack[sm.sp - 1];
	if (divisor === 0) {
		return StackMachineError.divByZero().fromCode(sm.codeBlockId, sm.ip);
	} else {
		sm.stack[sm.sp - 2] = Math.trunc(sm.stack[sm.sp - 2] / divisor);
		sm.sp--;
	}
	return null;
};

PLW_NOARG_OPS[OPCODE_DIVF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let divisor = sm.stack[sm.sp - 1];
	if (divisor === 0) {
		return StackMachineError.divByZero().fromCode(sm.codeBlockId, sm.ip);
	} else {
		sm.stack[sm.sp - 2] = sm.stack[sm.sp - 2] / divisor;
		sm.sp--;
	}
	return null;
};
	
PLW_NOARG_OPS[OPCODE_REM] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let divisor = sm.stack[sm.sp - 1];
	if (divisor === 0) {
		return StackMachineError.divByZero().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = sm.stack[sm.sp - 2] % divisor;
	sm.sp--;
	return null;
};
	
PLW_NOARG_OPS[OPCODE_ADD] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] += sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_ADDF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] += sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_SUB] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] -= sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_SUBF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] -= sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_MUL] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] *= sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_MULF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] *= sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_NEG] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 1] = -sm.stack[sm.sp - 1]; 
	return null;
};

PLW_NOARG_OPS[OPCODE_NEGF] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 1] = -sm.stack[sm.sp - 1]; 
	return null;
};

PLW_NOARG_OPS[OPCODE_GT] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] > sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_GTF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] > sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_LT] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] < sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_LTF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] < sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_GTE] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] >= sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_GTEF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] >= sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_LTE] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] <= sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_LTEF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] <= sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_AND] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = ((sm.stack[sm.sp - 2] !== 0) && (sm.stack[sm.sp - 1] !== 0)) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_OR] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = ((sm.stack[sm.sp - 2] !== 0) || (sm.stack[sm.sp - 1] !== 0)) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[OPCODE_NOT] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 1] = sm.stack[sm.sp - 1] === 0 ? 1 : 0;
	return null;
};


let PLW_OPS = [];

PLW_OPS[OPCODE_NOARG] = function(sm, code) {
	return PLW_NOARG_OPS[code](sm);
};

PLW_OPS[OPCODE_POP_VOID] = function(sm, cellCount) {
	if (cellCount < 0 || cellCount > sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	for (let i = sm.sp - 1; i >= sm.sp - cellCount; i--) {
		if (sm.stackMap[i] === true) {
			sm.refMan.decRefCount(sm.stack[i], sm.refManError);
			if (sm.refManError.hasError()) {
				return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
			}
		}
	}
	sm.sp -= cellCount;
	return null;
};
	
PLW_OPS[OPCODE_CALL_NATIVE] = function(sm, nativeId) {
	if (nativeId < 0 || nativeId >= sm.natives.length) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let argCount = sm.stack[sm.sp - 1];
	if (sm.sp < 1 + argCount) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let error = sm.natives[nativeId](sm);
	if (error !== null) {
		if (error.errorMsg.charAt(0) === "@") {
			return error;
		}
		console.log("error from native function " + nativeId);
		return error.fromCode(sm.codeBlockId, sm.ip);
	}
	return null;
};
	
PLW_OPS[OPCODE_CALL_INTERNAL] = function(sm, ifun) {
	if (ifun < 0 || ifun >= sm.internals.length) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let error = sm.internals[ifun](sm);
	if (error !== null) {
		return error.fromCode(sm.codeBlockId, sm.ip);
	}
	return null;
};
	
PLW_OPS[OPCODE_PUSH_GLOBAL] = function(sm, offset) {
	if (offset < 0 || offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.stack[offset];
	sm.stackMap[sm.sp] = sm.stackMap[offset];
	if (sm.stackMap[sm.sp] === true) {
		sm.refMan.incRefCount(sm.stack[sm.sp], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}
	}
	sm.sp++;
	return null;
};
	
PLW_OPS[OPCODE_PUSH_GLOBAL_MOVE] = function(sm, offset) {
	if (offset < 0 || offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.stack[offset];
	sm.stackMap[sm.sp] = sm.stackMap[offset];
	sm.stack[offset] = -1;
	sm.stackMap[offset] = false;
	sm.sp++;
	return null;
};
	
PLW_OPS[OPCODE_PUSH_GLOBAL_FOR_MUTATE] = function(sm, offset) {
	if (offset < 0 || offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[offset] = sm.refMan.makeMutable(sm.stack[offset], sm.refManError);
	if (sm.refManError.hasError()) {
		return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stackMap[offset] = true;
	sm.stack[sm.sp] = sm.stack[offset];
	sm.stackMap[sm.sp] = sm.stackMap[offset];
	if (sm.stackMap[sm.sp] === true) {
		sm.refMan.incRefCount(sm.stack[sm.sp], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}
	}
	sm.sp++;
	return null;
};
	
PLW_OPS[OPCODE_PUSH_LOCAL] = function(sm, offset) {
	if (sm.bp + offset < 0 || sm.bp + offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.stack[sm.bp + offset];
	sm.stackMap[sm.sp] = sm.stackMap[sm.bp + offset];
	if (sm.stackMap[sm.sp] === true) {
		sm.refMan.incRefCount(sm.stack[sm.sp], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}
	}
	sm.sp++;
	return null;
};
	
PLW_OPS[OPCODE_PUSH_LOCAL_MOVE] = function(sm, offset) {
	if (sm.bp + offset < 0 || sm.bp + offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.stack[sm.bp + offset];
	sm.stackMap[sm.sp] = sm.stackMap[sm.bp + offset];
	sm.stack[sm.bp + offset] = -1;
	sm.stackMap[sm.bp + offset] = false;
	sm.sp++;
	return null;
};
	
PLW_OPS[OPCODE_PUSH_LOCAL_FOR_MUTATE] = function(sm, offset) {
	if (sm.bp + offset < 0 || sm.bp + offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.bp + offset] = sm.refMan.makeMutable(sm.stack[sm.bp + offset], sm.refManError);
	if (sm.refManError.hasError()) {
		return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stackMap[sm.bp + offset] = true;
	sm.stack[sm.sp] = sm.stack[sm.bp + offset];
	sm.stackMap[sm.sp] = sm.stackMap[sm.bp + offset];
	if (sm.stackMap[sm.sp] === true) {
		sm.refMan.incRefCount(sm.stack[sm.sp], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}
	}
	sm.sp++;
	return null;
};
	
PLW_OPS[OPCODE_POP_GLOBAL] = function(sm, offset) {
	if (sm.sp < 1 || offset < 0 || offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (sm.stackMap[offset] === true) {
		sm.refMan.decRefCount(sm.stack[offset], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}						
	}
	sm.stack[offset] = sm.stack[sm.sp - 1];
	sm.stackMap[offset] = sm.stackMap[sm.sp - 1];
	sm.sp--;
	return null;
};
	
PLW_OPS[OPCODE_POP_LOCAL] = function(sm, offset) {
	if (sm.sp < 1 || sm.bp + offset < 0 || sm.bp + offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (sm.stackMap[sm.bp + offset] === true) {
		sm.refMan.decRefCount(sm.stack[sm.bp + offset], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}
	}
	sm.stack[sm.bp + offset] = sm.stack[sm.sp - 1];
	sm.stackMap[sm.bp + offset] = sm.stackMap[sm.sp - 1];
	sm.sp--;
	return null;
};
	
PLW_OPS[OPCODE_JZ] = function(sm, arg1) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (sm.stack[sm.sp - 1] === 0) {
		sm.ip = arg1;
	}
	sm.sp--;
	return null;
};

PLW_OPS[OPCODE_JNZ] = function(sm, arg1) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (sm.stack[sm.sp - 1] !== 0) {
		sm.ip = arg1;
	}
	sm.sp--;
	return null;
};

PLW_OPS[OPCODE_JMP] = function(sm, arg1) {
	sm.ip = arg1;
	return null;
};
	
PLW_OPS[OPCODE_PUSH] = function(sm, arg1) {
	sm.stack[sm.sp] = arg1;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	return null;
};

PLW_OPS[OPCODE_CALL] = function(sm, arg1) {
	if (arg1 < 0 || arg1 > sm.codeBlocks.length) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.codeBlockId;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	sm.stack[sm.sp] = sm.ip;
	sm.stackMap[sm.sp] = false;
	sm.sp++;					
	sm.stack[sm.sp] = sm.bp;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	sm.bp = sm.sp;
	sm.codeBlockId = arg1;
	sm.ip = 0;
	return null;
};

PLW_OPS[OPCODE_PUSHF] = function(sm, floatId) {
	if (floatId < 0 || floatId >= sm.codeBlocks[sm.codeBlockId].floatConsts.length) {
		return StackMachineError.constAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);						
	}
	sm.stack[sm.sp] = sm.codeBlocks[sm.codeBlockId].floatConsts[floatId];
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	return null;
};
	
PLW_OPS[OPCODE_EQ] = function(sm, count) {
	if (sm.count < 1 || sm.sp < count * 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let idx1 = sm.sp - 2 * count;
	let idx2 = sm.sp - count;
	let result = true;
	for (let i = 0; i < count; i++) {
		if (result === true) {
			if (sm.stackMap[idx1]) {
				result = sm.refMan.compareRefs(sm.stack[idx1], sm.stack[idx2], sm.refManError);
				if (sm.refManError.hasError()) {
					return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
				}
				if (sm.refManError.hasError()) {
					return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
				}
			} else {
				result = sm.stack[idx1] === sm.stack[idx2];
			}
		}
		if (sm.stackMap[idx1]) {
			sm.refMan.decRefCount(sm.stack[idx1], sm.refManError);
			if (sm.refManError.hasError()) {
				return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
			}
		}
		if (sm.stackMap[idx2]) {
			sm.refMan.decRefCount(sm.stack[idx2], sm.refManError);
			if (sm.refManError.hasError()) {
				return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
			}
		}
		idx1++;
		idx2++;
	}
	sm.stack[sm.sp - 2 * count] = result ? 1 : 0;
	sm.stackMap[sm.sp - 2 * count] = false;
	sm.sp -= 2 * count - 1;
	return null;
};
	
PLW_OPS[OPCODE_RET] = function(sm, count) {
	if (sm.count < 1 || sm.bp < 4 || sm.bp > sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let previousBp = sm.stack[sm.bp - 1];
	let previousIp = sm.stack[sm.bp - 2];
	let previousCodeBlockId = sm.stack[sm.bp - 3];
	let argCount = sm.stack[sm.bp - 4];
	if (sm.bp < 4 + argCount) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	for (let i = sm.sp - count - 1; i >= sm.bp - 4 - argCount; i--) {
		if (sm.stackMap[i] === true) {
			sm.refMan.decRefCount(sm.stack[i], sm.refManError);
			if (sm.refManError.hasError()) {
				return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
			}
		}
	}
	for (let i = 0; i < count; i++) {
		sm.stack[sm.bp - 4 - argCount + i] = sm.stack[sm.sp - count + i];
		sm.stackMap[sm.bp - 4 - argCount + i] = sm.stackMap[sm.sp - count + i];
	}
	sm.sp = sm.bp - 4 - argCount + count;
	sm.bp = previousBp;
	sm.codeBlockId = previousCodeBlockId;
	sm.ip = previousIp;
	return null;
};
	
PLW_OPS[OPCODE_DUP] = function(sm, count) {
	if (sm.count < 1 || sm.sp < count) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	for (let i = 0; i < count; i++) {
		sm.stack[sm.sp] = sm.stack[sm.sp - count];
		sm.stackMap[sm.sp] = sm.stackMap[sm.sp - count];
		if (sm.stackMap[sm.sp] === true) {
			sm.refMan.incRefCount(sm.stack[sm.sp], sm.refManError);
			if (sm.refManError.hasError()) {
				return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
			}
		}
		sm.sp++; 
	}
	return null;
};

PLW_OPS[OPCODE_SWAP] = function(sm, count) {
	if (sm.count < 1 || sm.sp < count) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	for (let i = 0; i < count / 2; i++) {
		let tmp = sm.stack[sm.sp - count + i];
		let tmpMap = sm.stackMap[sm.sp - count + i];
		sm.stack[sm.sp - count + i] = sm.stack[sm.sp - 1 - i];
		sm.stackMap[sm.sp - count + i] = sm.stackMap[sm.sp - 1 - i];
		sm.stack[sm.sp - 1 - i] = tmp;
		sm.stackMap[sm.sp - 1 - i] = tmpMap;
	}
	return null;
};

class StackMachine {

	constructor() {
		this.stackMap = new Array(1000).fill(false);
		this.stack = new Array(1000).fill(0);
		this.sp = 0;
		this.bp = 0;
		this.ip = 0;
		this.codeBlockId = -1;
		this.codeBlocks = null;
		this.natives = null;
		this.internals = null;
		this.refMan = new PlwRefManager();
		this.refManError = new PlwRefManagerError();
	}
	
	hasRefManError() {
		return this.refManError.hasError();
	}
	
	errorFromRefMan() {
		return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
	}
	
	popResult() {
		this.sp--;
		return this.stack[this.sp];
	}
		
	execute(codeBlock, codeBlocks, internals, natives) {
		this.codeBlocks = [...codeBlocks, codeBlock];
		this.internals = internals;
		this.natives = natives;
		this.ip = 0;
		this.codeBlockId = this.codeBlocks.length - 1;
		return this.runLoop();
	}

	runLoop() {
		let code = 0;
		let ret = null;
		let arg = 0;
		let codeBlock = null;
		for (;;) {
			codeBlock = this.codeBlocks[this.codeBlockId];
			if (this.ip >= codeBlock.codeSize - 1) {
				break;
			}
			code = codeBlock.codes[this.ip];
			this.ip++;
			arg = codeBlock.codes[this.ip];
			this.ip++;
			ret = PLW_OPS[code](this, arg);
			if (ret !== null) {
				return ret;
			}
		}
		return null;
	}
	
	dump(println) {
		println("cb: " + this.codeBlockId + ", ip: " + this.ip + ", bp: " + this.bp + ", sp: " + this.sp);
		if (this.codeBlockId !== -1) {
			let codeBlock = this.codeBlocks[this.codeBlockId];
			println("codeblock " + this.codeBlockId + ": " + codeBlock.blockName);
			for (let i = 0; i < codeBlock.codeSize - 1; i += 2) {
				let opcode = codeBlock.codes[i];
				let arg1 = codeBlock.codes[i + 1];
				let prefix = (i === this.ip ? "> " : "") + i + ": ";
				prefix = "          ".substring(0, 10 - prefix.length) + prefix;
				if (opcode === OPCODE_NOARG) {
					println(prefix + PLW_NOARG_OPCODES[arg1]);
				} else if (opcode === OPCODE_CALL_INTERNAL) {
					println(prefix + PLW_IFUNS[arg1]);
				} else {
					let opcodeName = PLW_OPCODES[opcode];
					println(prefix + opcodeName + "                              ".substring(0, 26 - opcodeName.length) + arg1);
				}
			}
		}
		println("stack:");
		for (let i = 0; i < this.sp; i++) {
			let prefix = "    ";
			if (this.bp === i) {
				prefix = " bp ";
			}
			println(prefix + i + ": " + (this.stackMap[i] === true ? "ref " : "    ") + this.stack[i]);
		}
		println("heap (total: " + this.refMan.refCount + ", free: " + this.refMan.freeRefIdCount + "):");
		for (let i = 0; i < this.refMan.refCount; i++) {
			let ref = this.refMan.refs[i];
			if (ref !== null) {
				println("    " + i + ": " + ref.refCount + " " + PLW_TAG_REF_NAMES[ref.tag] + " " + JSON.stringify(ref));
			}
		}
	}

}

