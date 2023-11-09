"use strict";
/******************************************************************************************************************************************

	CodeBlock
	
	Represent a list of low level StackMachine instructions

******************************************************************************************************************************************/

const PLW_TMPOP_BEGIN_LOOP = -1;
const PLW_TMPOP_END_LOOP = -2;
const PLW_TMPOP_EXIT_LOOP = -3;


class CodeBlock {

	constructor(blockName) {
		this.blockName = blockName;
		this.codes = [];
		this.codeSize = 0;
		this.strConsts = [];
		this.strConstSize = 0;
		this.floatConsts = [];
		this.floatConstSize = 0;
	}
	
	beginLoop() {
		this.code1(PLW_TMPOP_BEGIN_LOOP);
	}
	
	endLoop() {
		this.code1(PLW_TMPOP_END_LOOP);
	}
	
	endLoop() {
		this.code1(PLW_TMPOP_EXIT_LOOP);
	}
	
	currentLoc() {
		return this.codeSize - 1;
	}
	
	addStrConst(str) {
		for (let i = 0; i < this.strConstSize; i++) {
			if (this.strConsts[i] === str) {
				return i;
			}
		}
		let strId = this.strConstSize;
		this.strConsts[strId] = str;
		this.strConstSize++;
		return strId;
	}
	
	addFloatConst(f) {
		for (let i = 0; i < this.floatConstSize; i++) {
			if (this.floatConsts[i] === f) {
				return i;
			}
		}
		let floatId = this.floatConstSize;
		this.floatConsts[floatId] = f;
		this.floatConstSize++;
		return floatId;
	}

	setLoc(offset) {
		this.codes[offset] = this.codeSize;
	}
	
	code1(inst) {
		this.codes[this.codeSize] = PLW_OPCODE_NOARG;
		this.codeSize++;
		this.codes[this.codeSize] = inst;
		this.codeSize++;
	}
	
	code2(inst, arg) {
		this.codes[this.codeSize] = inst;
		this.codeSize++;
		this.codes[this.codeSize] = arg;
		this.codeSize++;
	}
	
	codeSuspend() {
		this.code1(PLW_OPCODE_SUSPEND);
	}
	
	codePush(val) {
		this.code2(PLW_OPCODE_PUSH, val);
		return this.codeSize - 1;
	}
	
	codePushf(val) {
		this.code2(PLW_OPCODE_PUSHF, val);
	}
		
	codePushGlobal(offset) {
		this.code2(PLW_OPCODE_PUSH_GLOBAL, offset);
	}
	
	codePushGlobalForMutate(offset) {
		this.code2(PLW_OPCODE_PUSH_GLOBAL_FOR_MUTATE, offset);
	}
	
	codePushLocal(offset) {
		this.code2(PLW_OPCODE_PUSH_LOCAL, offset);
	}
	
	codePushLocalMove(offset) {
		this.code2(PLW_OPCODE_PUSH_LOCAL_MOVE, offset);
	}	
	
	codePushLocalForMutate(offset) {
		this.code2(PLW_OPCODE_PUSH_LOCAL_FOR_MUTATE, offset);
	}	
		
	codePopGlobal(offset) {
		this.code2(PLW_OPCODE_POP_GLOBAL, offset);
	}
	
	codePopLocal(offset) {
		this.code2(PLW_OPCODE_POP_LOCAL, offset);
	}
	
	codePopVoid(count) {
		this.code2(PLW_OPCODE_POP_VOID, count);
	}
	
	codeAdd() {
		this.code1(PLW_OPCODE_ADD);
	}
	
	codeSub() {
		this.code1(PLW_OPCODE_SUB);
	}

	codeDiv() {
		this.code1(PLW_OPCODE_DIV);
	}

	codeRem() {
		this.code1(PLW_OPCODE_REM);
	}

	codeMul() {
		this.code1(PLW_OPCODE_MUL);
	}
	
	codeNeg() {
		this.code1(PLW_OPCODE_NEG);
	}
	
	codeGt() {
		this.code1(PLW_OPCODE_GT);
	}

	codeGte() {
		this.code1(PLW_OPCODE_GTE);
	}

	codeLt() {
		this.code1(PLW_OPCODE_LT);
	}

	codeLte() {
		this.code1(PLW_OPCODE_LTE);
	}
	
	// real

	codeAddf() {
		this.code1(PLW_OPCODE_ADDF);
	}
	
	codeSubf() {
		this.code1(PLW_OPCODE_SUBF);
	}

	codeDivf() {
		this.code1(PLW_OPCODE_DIVF);
	}

	codeMulf() {
		this.code1(PLW_OPCODE_MULF);
	}
	
	codeNegf() {
		this.code1(PLW_OPCODE_NEGF);
	}
	
	codeGtf() {
		this.code1(PLW_OPCODE_GTF);
	}

	codeGtef() {
		this.code1(PLW_OPCODE_GTEF);
	}

	codeLtf() {
		this.code1(PLW_OPCODE_LTF);
	}

	codeLtef() {
		this.code1(PLW_OPCODE_LTEF);
	}
		
	// real

	codeAnd() {
		this.code1(PLW_OPCODE_AND);
	}
	
	codeOr() {
		this.code1(PLW_OPCODE_OR);
	}
	
	codeNot() {
		this.code1(PLW_OPCODE_NOT);
	}
		
	codeJz(offset) {
		this.code2(PLW_OPCODE_JZ, offset);
		return this.codeSize - 1;
	}
	
	codeJnz(offset) {
		this.code2(PLW_OPCODE_JNZ, offset);
		return this.codeSize - 1;
	}
	
	codeJmp(offset) {
		this.code2(PLW_OPCODE_JMP, offset);
		return this.codeSize - 1;
	}
				
	codeCall(ptr) {
		this.code2(PLW_OPCODE_CALL, ptr);
	}
		
	codeCallNative(ptr) {
		this.code2(PLW_OPCODE_CALL_NATIVE, ptr);
	}
	
	codeEq(count) {
		this.code2(PLW_OPCODE_EQ, count);
	}
	
	codeRet(count) {
		this.code2(PLW_OPCODE_RET, count);
	}
	
	codeDup(count) {
		this.code2(PLW_OPCODE_DUP, count);
	}
	
	codeSwap(count) {
		this.code2(PLW_OPCODE_SWAP, count);
	}
		
	codeExt(extOpcode) {
		this.code2(PLW_OPCODE_EXT, extOpcode);
	}
	
}

