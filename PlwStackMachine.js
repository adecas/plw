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
		this.stackMap = [];
		this.stack = [];
		this.sp = 0;
		this.bp = 0;
		this.ip = 0;
		this.codeBlockId = -1;
		this.codeBlocks = null;
		this.natives = null;
		this.refMan = new RefManager();
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
				if (ref.tag === "ref-exception-handler") {
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
	
	runLoop() {
		let refManError = new RefManagerError();
		while (this.ip < this.codeBlocks[this.codeBlockId].codeSize) {
			let code = this.codeBlocks[this.codeBlockId].codes[this.ip];
			this.ip++;
			if (code === "debug") {
				console.log(this);
			} else if (code === "dup") {
				if (this.sp < 1) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp] = this.stack[this.sp - 1];
				this.stackMap[this.sp] = this.stackMap[this.sp - 1];
				if (this.stackMap[this.sp]) {
					this.refMan.incRefCount(this.stack[this.sp]);
				}
				this.sp++;
			} else if (code === "swap") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				let tmp = this.stack[this.sp - 2];
				let tmpMap = this.stackMap[this.sp - 2];
				this.stack[this.sp - 2] = this.stack[this.sp - 1];
				this.stackMap[this.sp - 2] = this.stackMap[this.sp - 1];
				this.stack[this.sp - 1] = tmp;
				this.stackMap[this.sp - 1] = tmpMap;
			} else if (code === "add") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] += this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "addf") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] += this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "sub") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] -= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "subf") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] -= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "div") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				let divisor = this.stack[this.sp - 1];
				if (divisor === 0) {
					if (!this.raiseError(0, refManError)) {
						if (refManError.hasError()) {
							return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
						}
						return StackMachineError.divByZero().fromCode(this.codeBlockId, this.ip);
					}
				} else {
					this.stack[this.sp - 2] = Math.trunc(this.stack[this.sp - 2] / divisor);
					this.sp--;
				}
			} else if (code === "divf") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] /= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "rem") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				let divisor = this.stack[this.sp - 1];
				if (divisor === 0) {
					return StackMachineError.divByZero().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = this.stack[this.sp - 2] % divisor;
				this.sp--;
			} else if (code === "mul") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] *= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "mulf") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] *= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "neg") {
				if (this.sp < 1) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 1] = -this.stack[this.sp - 1]; 
			} else if (code === "negf") {
				if (this.sp < 1) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 1] = -this.stack[this.sp - 1]; 
			} else if (code === "gt") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] > this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "gtf") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] > this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "lt") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] < this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "ltf") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] < this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "gte") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] >= this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "gtef") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] >= this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "lte") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] <= this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "ltef") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] <= this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "and") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = ((this.stack[this.sp - 2] !== 0) && (this.stack[this.sp - 1] !== 0)) ? 1 : 0;
				this.sp--;
			} else if (code === "or") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = ((this.stack[this.sp - 2] !== 0) || (this.stack[this.sp - 1] !== 0)) ? 1 : 0;
				this.sp--;
			} else if (code === "not") {
				if (this.sp < 1) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 1] = this.stack[this.sp - 1] === 0 ? 1 : 0;
			} else if (code === "eq") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] === this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "eqf") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] === this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "eq_ref") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				let result = this.refMan.compareRefs(this.stack[this.sp - 2], this.stack[this.sp - 1], refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
				this.refMan.decRefCount(this.stack[this.sp - 2], refManError);
				if (!refManError.hasError()) {
				    this.refMan.decRefCount(this.stack[this.sp - 1], refManError);
				}
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = result ? 1 : 0;
				this.sp--;
			} else if (code === "ne") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] !== this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "nef") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] !== this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "push_ptr_offset" || code === "push_ptr_offset_for_mutate") {
				if (this.sp < 2) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				let refId = this.stack[this.sp - 2];
				let ref = this.refMan.getRefOfType(refId, "ref-object", refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
				let offset = this.stack[this.sp - 1];
				if (offset < 0 || offset >= ref.totalSize) {
					return StackMachineError.refAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				if (code === "push_ptr_offset_for_mutate") {
					ref.ptr[offset] = this.refMan.makeMutable(ref.ptr[offset], refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
					}				
				}
				this.stack[this.sp - 2] = ref.ptr[offset];
				this.stackMap[this.sp - 2] = ref.isOffsetRef(offset);
				if (this.stackMap[this.sp - 2] === true) {
					this.refMan.incRefCount(this.stack[this.sp - 2], refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
					}
				}
				this.sp--;
				this.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
			} else if (code === "pop_ptr_offset") {
				if (this.sp < 3) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}				
				let refId = this.stack[this.sp - 3];
				let ref = this.refMan.getRefOfType(refId, "ref-object", refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
				let offset = this.stack[this.sp - 2];
				let val = this.stack[this.sp - 1];
				if (offset < 0 || offset >= ref.totalSize) {
					return StackMachineError.refAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				if (ref.isOffsetRef(offset)) {
					this.refMan.decRefCount(ref.ptr[offset], refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
					}
				}
				ref.ptr[offset] = val;
				this.sp -= 3;
				this.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
			} else if (code === "raise") {
				if (this.sp < 1) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				let errorCode = this.stack[this.sp - 1];
				if(!this.raiseError(errorCode, refManError)) {
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
					}
					return StackMachineError.exception(errorCode).fromCode(this.codeBlockId, this.ip);					
				}
			} else if (code === "ret_val") {
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
						this.refMan.decRefCount(this.stack[i], refManError);
						if (refManError.hasError()) {
							return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
						}
					}
				}
				this.sp = this.bp - 3 - argCount;
				this.stack[this.sp - 1] = retVal;
				this.stackMap[this.sp - 1] = retValIsRef;
				this.bp = previousBp;
				this.codeBlockId = previousCodeBlockId;
				this.ip = previousIp;
			} else if (code === "ret") {
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
						this.refMan.decRefCount(this.stack[i], refManError);
						if (refManError.hasError()) {
							return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
						}
					}
				}
				this.sp = this.bp - 4 - argCount;
				this.bp = previousBp;
				this.codeBlockId = previousCodeBlockId;
				this.ip = previousIp;
			} else if (code === "yield") {
				if (this.bp < 4 || this.bp >= this.sp) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				let refId = this.stack[this.bp - 4];
				let ref = this.refMan.getRefOfType(refId, "ref-frame", refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
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
				this.refMan.decRefCount(refId, refManError);		
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
			} else if (code === "yield_done") {
				if (this.bp < 4 || this.bp > this.sp) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				let refId = this.stack[this.bp - 4];
				let ref = this.refMan.getRefOfType(refId, "ref-frame", refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
				ref.resizeFrame(2);
				ref.ptr[1] = this.ip;
				let previousBp = this.stack[this.bp - 1];
				let previousIp = this.stack[this.bp - 2];
				let previousCodeBlockId = this.stack[this.bp - 3];
				for (let i = this.sp - 1; i >= this.bp - 4; i --) {
					if (this.stackMap[i] === true) {
						this.refMan.decRefCount(this.stack[i], refManError);
						if (refManError.hasError()) {
							return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
						}
					}
				}
				this.sp = this.bp - 3;
				this.stack[this.sp - 1] = 0;
				this.stackMap[this.sp - 1] = false;
				this.bp = previousBp;
				this.codeBlockId = previousCodeBlockId;
				this.ip = previousIp;
			} else if (code === "next") {
				if (this.sp < 1) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				let refId = this.stack[this.sp - 1];
				let ref = this.refMan.getRefOfType(refId, "ref-frame", refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
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
			} else if (code === "ended") {
				if (this.sp < 1) {
					return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				let refId = this.stack[this.sp - 1];
				let ref = this.refMan.getRefOfType(refId, "ref-frame", refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
				let ended = ref.ptr[1] >= this.codeBlocks[ref.ptr[0]].codeSize ? 1 : 0;
				this.refMan.decRefCount(this.stack[this.sp - 1], refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
				this.stack[this.sp - 1] = ended;
			} else {
				//
				// 1 operand (in arg1)
				//
				if (this.ip >= this.codeBlocks[this.codeBlockId].codeSize) {
					return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				let arg1 = this.codeBlocks[this.codeBlockId].codes[this.ip];
				this.ip++;
				if (code === "jz") {
					if (this.sp < 1) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					if (this.stack[this.sp - 1] === 0) {
						this.ip = arg1;
					}
					this.sp--;
				} else if (code === "jnz") {
					if (this.sp < 1) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					if (this.stack[this.sp - 1] !== 0) {
						this.ip = arg1;
					}
					this.sp--;
				} else if (code === "jmp") {
					this.ip = arg1;
				} else if (code === "push") {
					this.stack[this.sp] = arg1;
					this.stackMap[this.sp] = false;
					this.sp++;
				} else if (code === "push_global" || code === "push_global_for_mutate") {
					if (arg1 < 0 || arg1 >= this.sp) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					if (code === "push_global_for_mutate") {
						this.stack[arg1] = this.refMan.makeMutable(this.stack[arg1], refManError);
						if (refManError.hasError()) {
							return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
						}
						this.stackMap[arg1] = true;
					}
					this.stack[this.sp] = this.stack[arg1];
					this.stackMap[this.sp] = this.stackMap[arg1];
					if (this.stackMap[this.sp] === true) {
						this.refMan.incRefCount(this.stack[this.sp], refManError);
						if (refManError.hasError()) {
							return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
						}
					}
					this.sp++;
				} else if (code === "push_local" || code === "push_local_for_mutate") {
					if (this.bp + arg1 < 0 || this.bp + arg1 >= this.sp) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					if (code === "push_local_for_mutate") {
						this.stack[this.bp + arg1] = this.refMan.makeMutable(this.stack[this.bp + arg1], refManError);
						if (refManError.hasError()) {
							return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
						}
						this.stackMap[this.bp + arg1] = true;
					}
					this.stack[this.sp] = this.stack[this.bp + arg1];
					this.stackMap[this.sp] = this.stackMap[this.bp + arg1];
					if (this.stackMap[this.sp] === true) {
						this.refMan.incRefCount(this.stack[this.sp], refManError);
						if (refManError.hasError()) {
							return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
						}
					}
					this.sp++;
				} else if (code === "pop_global") {
					if (this.sp < 1 || arg1 < 0 || arg1 >= this.sp) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					if (this.stackMap[arg1] === true) {
						this.refMan.decRefCount(this.stack[arg1], refManError);
						if (refManError.hasError()) {
							return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
						}						
					}
					this.stack[arg1] = this.stack[this.sp - 1];
					this.stackMap[arg1] = this.stackMap[this.sp - 1];
					this.sp--;
				} else if (code === "pop_local") {
					if (this.sp < 1 || this.bp + arg1 >= this.sp) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					if (this.stackMap[this.bp + arg1] === true) {
						this.refMan.decRefCount(this.stack[this.bp + arg1], refManError);
						if (refManError.hasError()) {
							return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
						}
					}
					this.stack[this.bp + arg1] = this.stack[this.sp - 1];
					this.stackMap[this.bp + arg1] = this.stackMap[this.sp - 1];
					this.sp--;
				} else if (code === "pop_void") {
					if (arg1 < 0 || arg1 > this.sp) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					for (let i = this.sp - 1; i >= this.sp - arg1; i--) {
						if (this.stackMap[i] === true) {
							this.refMan.decRefCount(this.stack[i], refManError);
							if (refManError.hasError()) {
								return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
							}
						}
					}
					this.sp -= arg1;
				} else if (code === "create_string") {
					if (arg1 < 0 || arg1 >= this.codeBlocks[this.codeBlockId].strConsts.length) {
						return StackMachineError.constAccessOutOfBound().fromCode(this.codeBlockId, this.ip);						
					}
					let str = this.codeBlocks[this.codeBlockId].strConsts[arg1];
					this.stack[this.sp] = this.refMan.createString(str);
					this.stackMap[this.sp] = true;
					this.sp++;
				} else if (code === "create_object") {
					if (arg1 < 0 || arg1 > this.sp) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					let ptr = [];
					let offset = 0;
					for (let i = 0; i < arg1; i++) {
						if (this.stackMap[this.sp - arg1 + i] === true) {
							ptr[offset] = this.stack[this.sp - arg1 + i];
							offset++;
						}
					}
					let refSize = offset;
					if (refSize !== arg1) {
						for (let i = 0; i < arg1; i++) {
							if (this.stackMap[this.sp - arg1 + i] !== true) {
								ptr[offset] = this.stack[this.sp - arg1 + i];
								offset++;
							}
						}
					}
					let refId = this.refMan.createObject(refSize, arg1, ptr);
					this.sp = this.sp - arg1 + 1;
					this.stack[this.sp - 1] = refId; 
					this.stackMap[this.sp - 1] = true;
				} else if (code === "call") {
					if (arg1 < -1 || arg1 > this.codeBlocks.length) {
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
				} else if (code === "call_native") {
					if (arg1 < 0 || arg1 >= this.natives.length) {
						return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					if (this.sp < 1) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					let argCount = this.stack[this.sp - 1];
					if (this.sp < 1 + argCount) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					let result = this.natives[arg1](this);
					if (result !== null) {
						return result;
					}
				} else if (code === "init_generator") {
					// stack is:
					//   arg1              sp - nbParam - 1
					//   ...
					//   argN
					//   nbParam           sp - 1
					if (this.sp < 1) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					let nbParam = this.stack[this.sp - 1];
					if (this.sp < 1) {
						return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}
					if (nbParam < 0 || this.sp < nbParam + 1) {
						return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
					}					
					let ptr = [];
					let mapPtr = [];
					ptr[0] = arg1;
					ptr[1] = 0;
					for (let i = 0; i < nbParam; i++) {
						ptr[i + 2] = this.stack[this.sp - nbParam - 1 + i];
						mapPtr[i + 2] = this.stackMap[this.sp - nbParam - 1 + i];
					}
					let refId = this.refMan.createFrame(nbParam + 2, ptr, mapPtr);
					this.stack[this.sp - nbParam - 1] = refId;
					this.stackMap[this.sp - nbParam - 1] = true;
					this.sp -= nbParam;
				} else if (code === "create_exception_handler") {
					this.stack[this.sp] = this.refMan.createExceptionHandler(this.codeBlockId, arg1, this.bp);
					this.stackMap[this.sp] = true;
					this.sp++;
				} else {
					return StackMachineError.unknownOp().fromCode(this.codeBlockId, this.ip);
				}
			}
		}
		return null;
	}

}

