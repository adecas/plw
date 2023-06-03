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
		
	Frame Object
		codeBlockId
		ip
		arg1
		argN
		local1
		...
		localN

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
		this.refMan = new PlwRefManager();
		this.offsetVal = new PlwOffsetValue();
		this.refManError = new PlwRefManagerError();
	}
	
	popResult() {
		this.sp--;
		return this.stack[this.sp];
	}
	
	raiseError(errorCode, refManError) {
		while (this.sp > 0) {
			if (this.stackMap[this.sp - 1] === true) {
				let refId = this.stack[this.sp - 1];
				let ref = this.refMan.getRef(refId, refManError);
				if (refManError.hasError()) {
					return false;
				}
				if (ref.tag === PLW_TAG_REF_EXCEPTION_HANDLER) {
					this.bp = ref.bp;
					this.ip = ref.ip;
					this.codeBlockId = ref.codeBlockId;
					this.refMan.decRefCount(refId, refManError);
					if (refManError.hasError()) {
						return false;
					}
					this.stack[this.sp - 1] = errorCode;
					this.stackMap[this.sp - 1] = false;
					return true;
				}
				this.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return false;
				}
			}
			this.sp--;
		}
		return false;
	}
	
	execute(codeBlock, codeBlocks, natives) {
		this.codeBlocks = [...codeBlocks, codeBlock];
		this.natives = natives;
		this.ip = 0;
		this.codeBlockId = this.codeBlocks.length - 1;
		return this.runLoop();
	}
	
	opcodeSwap() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let tmp = this.stack[this.sp - 2];
		let tmpMap = this.stackMap[this.sp - 2];
		this.stack[this.sp - 2] = this.stack[this.sp - 1];
		this.stackMap[this.sp - 2] = this.stackMap[this.sp - 1];
		this.stack[this.sp - 1] = tmp;
		this.stackMap[this.sp - 1] = tmpMap;
		return null;
	}
	
	opcodeDiv() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let divisor = this.stack[this.sp - 1];
		if (divisor === 0) {
			if (!this.raiseError(0, this.refManError)) {
				if (this.refManError.hasError()) {
					return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
				}
				return StackMachineError.divByZero().fromCode(this.codeBlockId, this.ip);
			}
		} else {
			this.stack[this.sp - 2] = Math.trunc(this.stack[this.sp - 2] / divisor);
			this.sp--;
		}
		return null;
	}
	
	opcodeRem() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let divisor = this.stack[this.sp - 1];
		if (divisor === 0) {
			return StackMachineError.divByZero().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = this.stack[this.sp - 2] % divisor;
		this.sp--;
		return null;
	}
	
	opcodePushPtrOffset() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.sp - 2];
		let offset = this.stack[this.sp - 1];
		this.refMan.getOffsetValue(refId, offset, false, this.refManError, this.offsetVal);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = this.offsetVal.val;
		this.stackMap[this.sp - 2] = this.offsetVal.isRef;
		if (this.offsetVal.isRef === true) {
			this.refMan.incRefCount(this.stack[this.sp - 2], this.refManError);
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp--;
		this.refMan.decRefCount(refId, this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		return null;
	}
	
	opcodePushPtrOffsetForMutate() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.sp - 2];
		let offset = this.stack[this.sp - 1];
		this.refMan.getOffsetValue(refId, offset, true, this.refManError, this.offsetVal);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = this.offsetVal.val;
		this.stackMap[this.sp - 2] = this.offsetVal.isRef;
		if (this.offsetVal.isRef === true) {
			this.refMan.incRefCount(this.stack[this.sp - 2], this.refManError);
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp--;
		this.refMan.decRefCount(refId, this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		return null;
	}

	opcodeEqRef() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let result = this.refMan.compareRefs(this.stack[this.sp - 2], this.stack[this.sp - 1], this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.refMan.decRefCount(this.stack[this.sp - 2], this.refManError);
		if (!this.refManError.hasError()) {
			this.refMan.decRefCount(this.stack[this.sp - 1], this.refManError);
		}
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = result ? 1 : 0;
		this.sp--;
		return null;
	}
	
	opcodePopPtrOffset() {
		if (this.sp < 3) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}				
		let refId = this.stack[this.sp - 3];
		let offset = this.stack[this.sp - 2];
		let val = this.stack[this.sp - 1];
		this.refMan.setOffsetValue(refId, offset, val, this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.sp -= 3;
		this.refMan.decRefCount(refId, this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		return null;
	}
	
	opcodeRaise() {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let errorCode = this.stack[this.sp - 1];
		if(!this.raiseError(errorCode, this.refManError)) {
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}
			return StackMachineError.exception(errorCode).fromCode(this.codeBlockId, this.ip);					
		}
		return null;
	}
	
	opcodeRetVal() {
		if (this.bp < 4 || this.bp > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let retVal = this.stack[this.sp - 1];
		let retValIsRef = this.stackMap[this.sp - 1];
		let previousBp = this.stack[this.bp - 1];
		let previousIp = this.stack[this.bp - 2];
		let previousCodeBlockId = this.stack[this.bp - 3];
		let argCount = this.stack[this.bp - 4];
		if (this.bp < 4 + argCount) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		for (let i = this.sp - 2; i >= this.bp - 4 - argCount; i--) {
			if (this.stackMap[i] === true) {
				this.refMan.decRefCount(this.stack[i], this.refManError);
				if (this.refManError.hasError()) {
					return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
				}
			}
		}
		this.sp = this.bp - 3 - argCount;
		this.stack[this.sp - 1] = retVal;
		this.stackMap[this.sp - 1] = retValIsRef;
		this.bp = previousBp;
		this.codeBlockId = previousCodeBlockId;
		this.ip = previousIp;
		return null;
	}
	
	opcodeRet() {
		if (this.bp < 4 || this.bp > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let previousBp = this.stack[this.bp - 1];
		let previousIp = this.stack[this.bp - 2];
		let previousCodeBlockId = this.stack[this.bp - 3];
		let argCount = this.stack[this.bp - 4];
		if (this.bp < 4 + argCount) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		for (let i = this.sp - 1; i >= this.bp - 4 - argCount; i--) {
			if (this.stackMap[i] === true) {
				this.refMan.decRefCount(this.stack[i], this.refManError);
				if (this.refManError.hasError()) {
					return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
				}
			}
		}
		this.sp = this.bp - 4 - argCount;
		this.bp = previousBp;
		this.codeBlockId = previousCodeBlockId;
		this.ip = previousIp;
		return null;
	}
	
	opcodeYield() {
		if (this.bp < 4 || this.bp >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.bp - 4];
		let ref = this.refMan.getRefOfType(refId, PLW_TAG_REF_MAPPED_RECORD, this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		ref.resizeFrame(1 + (this.sp - this.bp));
		ref.ptr[1] = this.ip;
		for (let i = 0; i < this.sp - this.bp - 1; i++) {
			ref.ptr[i + 2] = this.stack[this.bp + i];
			ref.mapPtr[i + 2] = this.stackMap[this.bp + i];
		}
		let retVal = this.stack[this.sp - 1];
		let retValIsRef = this.stackMap[this.sp - 1];
		let previousBp = this.stack[this.bp - 1];
		let previousIp = this.stack[this.bp - 2];
		let previousCodeBlockId = this.stack[this.bp - 3];
		this.sp = this.bp - 3;
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 1] = retVal;
		this.stackMap[this.sp - 1] = retValIsRef;
		this.bp = previousBp;
		this.codeBlockId = previousCodeBlockId;
		this.ip = previousIp;
		this.refMan.decRefCount(refId, this.refManError);		
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		return null;
	}
	
	opcodeYieldDone() {
		if (this.bp < 4 || this.bp > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.bp - 4];
		let ref = this.refMan.getRefOfType(refId, PLW_TAG_REF_MAPPED_RECORD, this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		ref.resizeFrame(2);
		ref.ptr[1] = this.ip;
		let previousBp = this.stack[this.bp - 1];
		let previousIp = this.stack[this.bp - 2];
		let previousCodeBlockId = this.stack[this.bp - 3];
		for (let i = this.sp - 1; i >= this.bp - 4; i --) {
			if (this.stackMap[i] === true) {
				this.refMan.decRefCount(this.stack[i], this.refManError);
				if (this.refManError.hasError()) {
					return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
				}
			}
		}
		this.sp = this.bp - 3;
		this.stack[this.sp - 1] = 0;
		this.stackMap[this.sp - 1] = false;
		this.bp = previousBp;
		this.codeBlockId = previousCodeBlockId;
		this.ip = previousIp;
		return null;
	}
	
	opcodeNext() {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.sp - 1];
		let ref = this.refMan.getRefOfType(refId, PLW_TAG_REF_MAPPED_RECORD, this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp] = this.codeBlockId;
		this.stackMap[this.sp] = false;
		this.sp++;
		this.stack[this.sp] = this.ip;
		this.stackMap[this.sp] = false;
		this.sp++;
		this.stack[this.sp] = this.bp;
		this.stackMap[this.sp] = false;
		this.sp++;
		this.bp = this.sp;
		for (let i = 0; i < ref.totalSize - 2; i++) {
			this.stack[this.sp] = ref.ptr[i + 2];
			this.stackMap[this.sp] = ref.mapPtr[i + 2];
			ref.mapPtr[i + 2] = false;
			this.sp++;
		}
		this.codeBlockId = ref.ptr[0];
		this.ip = ref.ptr[1];
		return null;
	}
	
	opcodeEnded() {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.sp - 1];
		let ref = this.refMan.getRefOfType(refId, PLW_TAG_REF_MAPPED_RECORD, this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		let ended = ref.ptr[1] >= this.codeBlocks[ref.ptr[0]].codeSize ? 1 : 0;
		this.refMan.decRefCount(this.stack[this.sp - 1], this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 1] = ended;
		return null;
	}
	
	opcodeBasicArrayTimes() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let val = this.stack[this.sp - 2];
		let count = this.stack[this.sp - 1];
		if (count < 0) {
			count = 0;
		}
		let ptr = new Array(count).fill(val);
		let refId = PlwBasicArrayRef.make(this.refMan, count, ptr);
		this.stack[this.sp - 2] = refId;
		this.stackMap[this.sp - 2] = true;
		this.sp--;
		return null;
	}
	
	opcodeArrayTimes() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let val = this.stack[this.sp - 2];
		let count = this.stack[this.sp - 1];
		if (count < 0) {
			count = 0;
		}
		let ptr = new Array(count).fill(val);
		let refId = PlwArrayRef.make(this.refMan, count, ptr);
		if (count === 0) {
			this.refMan.decRefCount(val, this.refManError);
		} else {
			this.refMan.addRefCount(val, count - 1, this.refManError);
		}
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = refId;
		this.stackMap[this.sp - 2] = true;
		this.sp--;
		return null;
	}
	
	opcodeDup() {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp] = this.stack[this.sp - 1];
		this.stackMap[this.sp] = this.stackMap[this.sp - 1];
		if (this.stackMap[this.sp]) {
			this.refMan.incRefCount(this.stack[this.sp]);
		}
		this.sp++;
		return null;
	}

	opcodeAdd() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] += this.stack[this.sp - 1];
		this.sp--;
		return null;
	}

	opcodeAddf() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] += this.stack[this.sp - 1];
		this.sp--;
		return null;
	}

	opcodeSub() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] -= this.stack[this.sp - 1];
		this.sp--;
		return null;
	}

	opcodeSubf() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] -= this.stack[this.sp - 1];
		this.sp--;
		return null;
	}

	opcodeDivf() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] /= this.stack[this.sp - 1];
		this.sp--;
		return null;
	}

	opcodeMul() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] *= this.stack[this.sp - 1];
		this.sp--;
		return null;
	}

	opcodeMulf() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] *= this.stack[this.sp - 1];
		this.sp--;
		return null;
	}

	opcodeNeg() {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 1] = -this.stack[this.sp - 1]; 
		return null;
	}

	opcodeNegf() {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 1] = -this.stack[this.sp - 1]; 
		return null;
	}

	opcodeGt() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] > this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeGtf() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] > this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeLt() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] < this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeLtf() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] < this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeGte() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] >= this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeGtef() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] >= this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeLte() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] <= this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeLtef() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] <= this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeAnd() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = ((this.stack[this.sp - 2] !== 0) && (this.stack[this.sp - 1] !== 0)) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeOr() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = ((this.stack[this.sp - 2] !== 0) || (this.stack[this.sp - 1] !== 0)) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeNot() {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 1] = this.stack[this.sp - 1] === 0 ? 1 : 0;
		return null;
	}

	opcodeEq() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] === this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeEqf() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] === this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeNe() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] !== this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcodeNef() {	
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = (this.stack[this.sp - 2] !== this.stack[this.sp - 1]) ? 1 : 0;
		this.sp--;
		return null;
	}

	opcode1(code) {
		switch(code) {
		case OPCODE_SUSPEND:
			return StackMachineError.suspended().fromCode(this.codeBlockId, this.ip);
		case OPCODE_DUP:
			return this.opcodeDup();
		case OPCODE_SWAP:
			return this.opcodeSwap();
		case OPCODE_ADD:
			return this.opcodeAdd();
		case OPCODE_ADDF:
			return this.opcodeAddf();
		case OPCODE_SUB:
			return this.opcodeSub();
		case OPCODE_SUBF:
			return this.opcodeSubf();
		case OPCODE_DIV:
			return this.opcodeDiv();
		case OPCODE_DIVF:
			return this.opcodeDivf();
		case OPCODE_REM:
			return this.opcodeRem();
		case OPCODE_MUL:
			return this.opcodeMul();
		case OPCODE_MULF:
			return this.opcodeMulf();
		case OPCODE_NEG:
			return this.opcodeNeg();
		case OPCODE_NEGF:
			return this.opcodeNegf();
		case OPCODE_GT:
			return this.opcodeGt();
		case OPCODE_GTF:
			return this.opcodeGtf();
		case OPCODE_LT:
			return this.opcodeLt();
		case OPCODE_LTF:
			return this.opcodeLtf();
		case OPCODE_GTE:
			return this.opcodeGte();
		case OPCODE_GTEF:
			return this.opcodeGtef();
		case OPCODE_LTE:
			return this.opcodeLte();
		case OPCODE_LTEF:
			return this.opcodeLtef();
		case OPCODE_AND:
			return this.opcodeAnd();
		case OPCODE_OR:
			return this.opcodeOr();
		case OPCODE_NOT:
			return this.opcodeNot();
		case OPCODE_EQ:
			return this.opcodeEq();
		case OPCODE_EQF:
			return this.opcodeEqf();
		case OPCODE_EQ_REF:
			return this.opcodeEqRef();
		case OPCODE_NE:
			return this.opcodeNe();
		case OPCODE_NEF:
			return this.opcodeNef();
		case OPCODE_PUSH_PTR_OFFSET:
			return this.opcodePushPtrOffset();
		case OPCODE_PUSH_PTR_OFFSET_FOR_MUTATE:
			return this.opcodePushPtrOffsetForMutate();
		case OPCODE_POP_PTR_OFFSET:
			return this.opcodePopPtrOffset();
		case OPCODE_RAISE:
			return this.opcodeRaise();
		case OPCODE_RET_VAL:
			return this.opcodeRetVal();
		case OPCODE_RET:
			return this.opcodeRet();
		case OPCODE_YIELD:
			return this.opcodeYield();
		case OPCODE_YIELD_DONE:
			return this.opcodeYieldDone();
		case OPCODE_NEXT:
			return this.opcodeNext();
		case OPCODE_ENDED:
			return this.opcodeEnded();
		case OPCODE_BASIC_ARRAY_TIMES:
			return this.opcodeBasicArrayTimes();
		case OPCODE_ARRAY_TIMES:
			return this.opcodeArrayTimes();
		default:
			return StackMachineError.unknownOp().fromCode(this.codeBlockId, this.ip);
		}	
	}
	
	opcodePopVoid(cellCount) {
		if (cellCount < 0 || cellCount > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		for (let i = this.sp - 1; i >= this.sp - cellCount; i--) {
			if (this.stackMap[i] === true) {
				this.refMan.decRefCount(this.stack[i], this.refManError);
				if (this.refManError.hasError()) {
					return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
				}
			}
		}
		this.sp -= cellCount;
		return null;
	}
	
	opcodeCreateString(strId) {
		if (strId < 0 || strId >= this.codeBlocks[this.codeBlockId].strConsts.length) {
			return StackMachineError.constAccessOutOfBound().fromCode(this.codeBlockId, this.ip);						
		}
		let str = this.codeBlocks[this.codeBlockId].strConsts[strId];
		this.stack[this.sp] = PlwStringRef.make(this.refMan, str);
		this.stackMap[this.sp] = true;
		this.sp++;
		return null;
	}
	
	opcodeCreateRecord(cellCount) {
		if (cellCount < 0 || cellCount > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let ptr = new Array(cellCount);
		let offset = 0;
		for (let i = 0; i < cellCount; i++) {
			if (this.stackMap[this.sp - cellCount + i] === true) {
				ptr[offset] = this.stack[this.sp - cellCount + i];
				offset++;
			}
		}
		let refSize = offset;
		if (refSize !== cellCount) {
			for (let i = 0; i < cellCount; i++) {
				if (this.stackMap[this.sp - cellCount + i] !== true) {
					ptr[offset] = this.stack[this.sp - cellCount + i];
					offset++;
				}
			}
		}
		let refId = PlwRecordRef.make(this.refMan, refSize, cellCount, ptr);
		this.sp = this.sp - cellCount + 1;
		this.stack[this.sp - 1] = refId; 
		this.stackMap[this.sp - 1] = true;
		return null;
	}

	opcodeCreateBasicArray(cellCount) {
		if (cellCount < 0 || cellCount > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let ptr = this.stack.slice(this.sp - cellCount, this.sp);
		let refId = PlwBasicArrayRef.make(this.refMan, cellCount, ptr);
		this.sp = this.sp - cellCount + 1;
		this.stack[this.sp - 1] = refId; 
		this.stackMap[this.sp - 1] = true;
		return null;
	}
	
	opcodeCreateArray(cellCount) {
		if (cellCount < 0 || cellCount > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let ptr = this.stack.slice(this.sp - cellCount, this.sp);
		let refId = PlwArrayRef.make(this.refMan, cellCount, ptr);
		this.sp = this.sp - cellCount + 1;
		this.stack[this.sp - 1] = refId; 
		this.stackMap[this.sp - 1] = true;
		return null;
	}
	
	opcodeCallNative(nativeId) {
		if (nativeId < 0 || nativeId >= this.natives.length) {
			return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let argCount = this.stack[this.sp - 1];
		if (this.sp < 1 + argCount) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let error = this.natives[nativeId](this);
		if (error !== null) {
			if (error.errorMsg.charAt(0) === "@") {
				return error;
			}
			console.log("error from native function " + nativeId);
			return error.fromCode(this.codeBlockId, this.ip);
		}
		return null;
	}
	
	opcodeInitGenerator(codeBlockId) {
		// stack is:
		//   arg1              sp - nbParam - 1
		//   ...
		//   argN
		//   nbParam           sp - 1
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (codeBlockId < 0 || codeBlockId > this.codeBlocks.length) {
			return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let nbParam = this.stack[this.sp - 1];
		if (nbParam < 0 || this.sp < nbParam + 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}					
		let ptr = new Array(nbParam + 2);
		let mapPtr = new Array(nbParam + 2);
		ptr[0] = codeBlockId;
		ptr[1] = 0;
		mapPtr[0] = false;
		mapPtr[1] = false;
		for (let i = 0; i < nbParam; i++) {
			ptr[i + 2] = this.stack[this.sp - nbParam - 1 + i];
			mapPtr[i + 2] = this.stackMap[this.sp - nbParam - 1 + i];
		}
		let refId = PlwMappedRecordRef.make(this.refMan, nbParam + 2, ptr, mapPtr);
		this.stack[this.sp - nbParam - 1] = refId;
		this.stackMap[this.sp - nbParam - 1] = true;
		this.sp -= nbParam;
		return null;
	}
	
	opcodePushGlobal(offset) {
		if (offset < 0 || offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp] = this.stack[offset];
		this.stackMap[this.sp] = this.stackMap[offset];
		if (this.stackMap[this.sp] === true) {
			this.refMan.incRefCount(this.stack[this.sp], this.refManError);
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp++;
		return null;
	}
	
	opcodePushGlobalMove(offset) {
		if (offset < 0 || offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp] = this.stack[offset];
		this.stackMap[this.sp] = this.stackMap[offset];
		this.stack[offset] = -1;
		this.stackMap[offset] = false;
		this.sp++;
		return null;
	}
	
	opcodePushGlobalForMutate(offset) {
		if (offset < 0 || offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[offset] = this.refMan.makeMutable(this.stack[offset], this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stackMap[offset] = true;
		this.stack[this.sp] = this.stack[offset];
		this.stackMap[this.sp] = this.stackMap[offset];
		if (this.stackMap[this.sp] === true) {
			this.refMan.incRefCount(this.stack[this.sp], this.refManError);
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp++;
		return null;
	}
	
	opcodePushLocal(offset) {
		if (this.bp + offset < 0 || this.bp + offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp] = this.stack[this.bp + offset];
		this.stackMap[this.sp] = this.stackMap[this.bp + offset];
		if (this.stackMap[this.sp] === true) {
			this.refMan.incRefCount(this.stack[this.sp], this.refManError);
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp++;
		return null;
	}
	
	opcodePushLocalMove(offset) {
		if (this.bp + offset < 0 || this.bp + offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp] = this.stack[this.bp + offset];
		this.stackMap[this.sp] = this.stackMap[this.bp + offset];
		this.stack[this.bp + offset] = -1;
		this.stackMap[this.bp + offset] = false;
		this.sp++;
		return null;
	}
	
	opcodePushLocalForMutate(offset) {
		if (this.bp + offset < 0 || this.bp + offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.bp + offset] = this.refMan.makeMutable(this.stack[this.bp + offset], this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stackMap[this.bp + offset] = true;
		this.stack[this.sp] = this.stack[this.bp + offset];
		this.stackMap[this.sp] = this.stackMap[this.bp + offset];
		if (this.stackMap[this.sp] === true) {
			this.refMan.incRefCount(this.stack[this.sp], this.refManError);
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp++;
		return null;
	}
	
	opcodePushIndirect(offset) {
		if (this.bp + offset < 0 || this.bp + offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let directOffset = this.stack[this.bp + offset];
		if (directOffset < 0 || directOffset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}		
		this.stack[this.sp] = this.stack[directOffset];
		this.stackMap[this.sp] = this.stackMap[directOffset];
		if (this.stackMap[this.sp] === true) {
			this.refMan.incRefCount(this.stack[this.sp], this.refManError);
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp++;
		return null;
	}
	
	opcodePushIndirectForMutate(offset) {
		if (this.bp + offset < 0 || this.bp + offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let directOffset = this.stack[this.bp + offset];
		if (directOffset < 0 || directOffset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}		
		this.stack[directOffset] = this.refMan.makeMutable(this.stack[directOffset], this.refManError);
		if (this.refManError.hasError()) {
			return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stackMap[directOffset] = true;
		this.stack[this.sp] = this.stack[directOffset];
		this.stackMap[this.sp] = this.stackMap[directOffset];
		if (this.stackMap[this.sp] === true) {
			this.refMan.incRefCount(this.stack[this.sp], this.refManError);
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp++;
		return null;
	}

	opcodePopGlobal(offset) {
		if (this.sp < 1 || offset < 0 || offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (this.stackMap[offset] === true) {
			this.refMan.decRefCount(this.stack[offset], this.refManError);
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}						
		}
		this.stack[offset] = this.stack[this.sp - 1];
		this.stackMap[offset] = this.stackMap[this.sp - 1];
		this.sp--;
		return null;
	}
	
	opcodePopLocal(offset) {
		if (this.sp < 1 || this.bp + offset < 0 || this.bp + offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (this.stackMap[this.bp + offset] === true) {
			this.refMan.decRefCount(this.stack[this.bp + offset], this.refManError);
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.stack[this.bp + offset] = this.stack[this.sp - 1];
		this.stackMap[this.bp + offset] = this.stackMap[this.sp - 1];
		this.sp--;
		return null;
	}
	
	opcodePopIndirect(offset) {
		if (this.sp < 1 || this.bp + offset < 0 || this.bp + offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let directOffset = this.stack[this.bp + offset];
		if (directOffset < 0 || directOffset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (this.stackMap[directOffset] === true) {
			this.refMan.decRefCount(this.stack[directOffset], this.refManError);
			if (this.refManError.hasError()) {
				return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.stack[directOffset] = this.stack[this.sp - 1];
		this.stackMap[directOffset] = this.stackMap[this.sp - 1];
		this.sp--;
		return null;
	}
	
	opcodePushIndirection(arg1) {
		this.stack[this.sp] = this.bp + arg1;
		this.stackMap[this.sp] = false;
		this.sp++;
		return null;
	}
	
	opcodeJz(arg1) {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (this.stack[this.sp - 1] === 0) {
			this.ip = arg1;
		}
		this.sp--;
		return null;
	}

	opcodeJnz(arg1) {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (this.stack[this.sp - 1] !== 0) {
			this.ip = arg1;
		}
		this.sp--;
		return null;
	}

	opcodeJmp(arg1) {
		this.ip = arg1;
		return null;
	}
	
	opcodePush(arg1) {
		this.stack[this.sp] = arg1;
		this.stackMap[this.sp] = false;
		this.sp++;
		return null;
	}

	opcodeCall(arg1) {
		if (arg1 < 0 || arg1 > this.codeBlocks.length) {
			return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp] = this.codeBlockId;
		this.stackMap[this.sp] = false;
		this.sp++;
		this.stack[this.sp] = this.ip;
		this.stackMap[this.sp] = false;
		this.sp++;					
		this.stack[this.sp] = this.bp;
		this.stackMap[this.sp] = false;
		this.sp++;
		this.bp = this.sp;
		this.codeBlockId = arg1;
		this.ip = 0;
		return null;
	}

	opcodeCreateExceptionHandler(arg1) {
		this.stack[this.sp] = PlwExceptionHandlerRef.make(this.refMan, this.codeBlockId, arg1, this.bp);
		this.stackMap[this.sp] = true;
		this.sp++;
		return null;
	}
	
	opcodePushf(floatId) {
		if (floatId < 0 || floatId >= this.codeBlocks[this.codeBlockId].floatConsts.length) {
			return StackMachineError.constAccessOutOfBound().fromCode(this.codeBlockId, this.ip);						
		}
		this.stack[this.sp] = this.codeBlocks[this.codeBlockId].floatConsts[floatId];
		this.stackMap[this.sp] = false;
		this.sp++;
		return null;
	}
	
	opcodeEqTuple(count) {
		if (this.sp < count * 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let idx1 = this.sp - 2 * count;
		let idx2 = this.sp - count;
		let result = true;
		for (let i = 0; i < count; i++) {
			if (this.stackMap[idx1]) {
				result = this.refMan.compareRefs(this.stack[idx1], this.stack[idx2], this.refManError);
				if (this.refManError.hasError()) {
					return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
				}
				this.refMan.decRefCount(this.stack[idx1], this.refManError);
				if (!this.refManError.hasError()) {
					this.refMan.decRefCount(this.stack[idx2], this.refManError);
				}
				if (this.refManError.hasError()) {
					return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
				}
			} else {
				result = this.stack[idx1] === this.stack[idx2];
			}
			if (result === false) {
				break;
			}
			idx1++;
			idx2++;
		}
		this.stack[this.sp - 2 * count] = result ? 1 : 0;
		this.stackMap[this.sp - 2 * count] = false;
		this.sp -= 2 * count - 1;
		return null;
	}
	
	opcodeRetTuple(count) {
		if (this.bp < 4 || this.bp > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let previousBp = this.stack[this.bp - 1];
		let previousIp = this.stack[this.bp - 2];
		let previousCodeBlockId = this.stack[this.bp - 3];
		let argCount = this.stack[this.bp - 4];
		if (this.bp < 4 + argCount) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		for (let i = this.sp - count - 1; i >= this.bp - 4 - argCount; i--) {
			if (this.stackMap[i] === true) {
				this.refMan.decRefCount(this.stack[i], this.refManError);
				if (this.refManError.hasError()) {
					return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
				}
			}
		}
		for (let i = 0; i < count; i++) {
			this.stack[this.bp - 4 - argCount + i] = this.stack[this.sp - count + i];
			this.stackMap[this.bp - 4 - argCount + i] = this.stackMap[this.sp - count + i];
		}
		this.sp = this.bp - 4 - argCount + count;
		this.bp = previousBp;
		this.codeBlockId = previousCodeBlockId;
		this.ip = previousIp;
		return null;
	}	

	opcode2(code, arg1) {
		switch(code) {
		case OPCODE_JZ:
			return this.opcodeJz(arg1);
		case OPCODE_JNZ:
			return this.opcodeJnz(arg1);
		case OPCODE_JMP:
			return this.opcodeJmp(arg1);
		case OPCODE_PUSH:
			return this.opcodePush(arg1);
		case OPCODE_PUSH_GLOBAL:
			return this.opcodePushGlobal(arg1);
		case OPCODE_PUSH_GLOBAL_MOVE:
			return this.opcodePushGlobalMove(arg1);
		case OPCODE_PUSH_GLOBAL_FOR_MUTATE:
			return this.opcodePushGlobalForMutate(arg1);
		case OPCODE_PUSH_LOCAL:
			return this.opcodePushLocal(arg1);
		case OPCODE_PUSH_LOCAL_MOVE:
			return this.opcodePushLocalMove(arg1);
		case OPCODE_PUSH_LOCAL_FOR_MUTATE:
			return this.opcodePushLocalForMutate(arg1);
		case OPCODE_PUSH_INDIRECTION:
			return this.opcodePushIndirection(arg1);
		case OPCODE_PUSH_INDIRECT:
			return this.opcodePushIndirect(arg1);
		case OPCODE_PUSH_INDIRECT_FOR_MUTATE:
			return this.opcodePushIndirectForMutate(arg1);
		case OPCODE_POP_GLOBAL:
			return this.opcodePopGlobal(arg1);
		case OPCODE_POP_LOCAL:
			return this.opcodePopLocal(arg1);
		case OPCODE_POP_INDIRECT:
			return this.opcodePopIndirect(arg1);
		case OPCODE_POP_VOID:
			return this.opcodePopVoid(arg1);
		case OPCODE_CREATE_STRING:
			return this.opcodeCreateString(arg1);
		case OPCODE_CREATE_RECORD:
			return this.opcodeCreateRecord(arg1);
		case OPCODE_CREATE_BASIC_ARRAY:
			return this.opcodeCreateBasicArray(arg1);
		case OPCODE_CREATE_ARRAY:
			return this.opcodeCreateArray(arg1);
		case OPCODE_CALL:
			return this.opcodeCall(arg1);
		case OPCODE_CALL_NATIVE:
			return this.opcodeCallNative(arg1);
		case OPCODE_INIT_GENERATOR:
			return this.opcodeInitGenerator(arg1);
		case OPCODE_CREATE_EXCEPTION_HANDLER:
			return this.opcodeCreateExceptionHandler(arg1);
		case OPCODE_PUSHF:
			return this.opcodePushf(arg1);
		case OPCODE_EQ_TUPLE:
			return this.opcodeEqTuple(arg1);
		case OPCODE_RET_TUPLE:
			return this.opcodeRetTuple(arg1);
		default:
			return StackMachineError.unknownOp().fromCode(this.codeBlockId, this.ip);
		}
	}
	
	runLoop() {
		let code = 0;
		let ret = null;
		let arg1 = 0;
		while (this.ip < this.codeBlocks[this.codeBlockId].codeSize) {
			code = this.codeBlocks[this.codeBlockId].codes[this.ip];
			this.ip++;
			if (code <= OPCODE1_MAX) {
				ret = this.opcode1(code);
			} else {
				if (this.ip >= this.codeBlocks[this.codeBlockId].codeSize) {
					return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				arg1 = this.codeBlocks[this.codeBlockId].codes[this.ip];
				this.ip++;
				ret = this.opcode2(code, arg1);
			}
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
			for (let i = 0; i < codeBlock.codeSize; i++) {
				let opcode = codeBlock.codes[i];
				let opcodeName = PLW_OPCODES[opcode];
				let prefix = (i === this.ip ? "> " : "") + i + ": ";
				prefix = "          ".substring(0, 10 - prefix.length) + prefix;
				if (opcode <= OPCODE1_MAX) {
					println(prefix + opcodeName);
				} else {
					i++;
					let arg1 = codeBlock.codes[i];
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

