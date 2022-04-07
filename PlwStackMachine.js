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
	constructor() {
		this.currentBlockId = -1;
		this.ip = 0;
		this.errorMsg = null;
		this.refManError = null;
	}
	
	fromCode(currentBlockId, ip) {
		this.currentBlockId = currentBlockId;
		this.ip = ip;
		return this;
	}
	
	stackAccessOutOfBound() {
		this.errorMsg = "stack access out of bound";
		return this;
	}
	
	codeAccessOutOfBound() {
		this.errorMsg = "code access out of bound";
		return this;
	}
	
	constAccessOutOfBound() {
		this.errorMsg = "const access out of bound";
		return this;
	}
	
	invalidRefType() {
		this.errorMsg = "invalid ref type";
		return this;
	}
	
	refAccessOutOfBound() {
		this.errorMsg = "ref access out of bound";
		return this;
	}
	
	divByZero() {
		this.errorMsg = "div by zero";
		return this;
	}
	
	referenceManagerError(refManError) {
		this.refManError = refManError;
		return this;
	}
	
	unknownOp() {
		this.errorMsg = "unknown op";
		return this;
	}
	
	nativeArgCountMismatch() {
		this.errorMsg = "wrong number of arguments provided to a native call";
		return this;
	}
}

class StackMachine {

	constructor() {
		this.stackMap = [];
		this.stack = [];
		this.sp = 0;
		this.bp = 0;
		this.refMan = new RefManager();
	}
	
	popResult() {
		this.sp--;
		return this.stack[this.sp];
	}
	
	execute(codeBlock, codeBlocks, natives) {
		let smError = new StackMachineError();
		let refManError = new RefManagerError();
		let currentCodeBlock = codeBlock;
		let currentCodeBlockId = -1;
		let i = 0;
		while (i < currentCodeBlock.codeSize) {
			let code = currentCodeBlock.codes[i];
			i++;
			if (code === "debug") {
				console.log(this);
			} else if (code === "add") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] += this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "addf") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] += this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "sub") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] -= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "subf") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] -= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "div") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				let divisor = this.stack[this.sp - 1];
				if (divisor === 0) {
					return smError.divByZero().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = Math.trunc(this.stack[this.sp - 2] / divisor);
				this.sp--;
			} else if (code === "divf") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] /= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "rem") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				let divisor = this.stack[this.sp - 1];
				if (divisor === 0) {
					return smError.divByZero().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = this.stack[this.sp - 2] % divisor;
				this.sp--;
			} else if (code === "mul") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] *= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "mulf") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] *= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "neg") {
				if (this.sp < 1) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 1] = -this.stack[this.sp - 1]; 
			} else if (code === "negf") {
				if (this.sp < 1) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 1] = -this.stack[this.sp - 1]; 
			} else if (code === "gt") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] > this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "gtf") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] > this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "lt") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] < this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "ltf") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] < this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "gte") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] >= this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "gtef") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] >= this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "lte") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] <= this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "ltef") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] <= this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "and") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = ((this.stack[this.sp - 2] !== 0) && (this.stack[this.sp - 1] !== 0)) ? 1 : 0;
				this.sp--;
			} else if (code === "or") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = ((this.stack[this.sp - 2] !== 0) || (this.stack[this.sp - 1] !== 0)) ? 1 : 0;
				this.sp--;
			} else if (code === "not") {
				if (this.sp < 1) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 1] = this.stack[this.sp - 1] === 0 ? 1 : 0;
			} else if (code === "eq") {
				if (this.sp < 1) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] === this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "eqf") {
				if (this.sp < 1) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] === this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "eq_ref") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				let result = this.refMan.compareRefs(this.stack[this.sp - 2], this.stack[this.sp - 1], refManError);
				if (refManError.hasError()) {
					return sm.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
				this.refMan.decRefCount(this.stack[this.sp - 2], refManError);
				if (!refManError.hasError()) {
				    this.refMan.decRefCount(this.stack[this.sp - 1], refManError);
				}
				if (refManError.hasError()) {
					return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = result ? 1 : 0;
				this.sp--;
			} else if (code === "ne") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] !== this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "nef") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] !== this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "push_ptr_offset") {
				if (this.sp < 2) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				let refId = this.stack[this.sp - 2];
				let ref = this.refMan.getRefOfType(refId, "ref-object", refManError);
				if (refManError.hasError()) {
					return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
				let offset = this.stack[this.sp - 1];
				if (offset < 0 || offset >= ref.totalSize) {
					return smError.refAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 2] = ref.ptr[offset];
				this.stackMap[this.sp - 2] = ref.isOffsetRef(offset);
				if (this.stackMap[this.sp - 2] === true) {
					this.refMan.incRefCount(this.stack[this.sp - 2], refManError);
					if (refManError.hasError()) {
						return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
					}
				}
				this.sp--;
				this.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
			} else if (code === "pop_ptr_offset") {
				if (this.sp < 3) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}				
				let refId = this.stack[this.sp - 3];
				let ref = this.refMan.getRefOfType(refId, "ref-object", refManError);
				if (refManError.hasError()) {
					return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
				let offset = this.stack[this.sp - 2];
				let val = this.stack[this.sp - 1];
				if (offset < 0 || offset >= ref.totalSize) {
					return smError.refAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				if (ref.isOffsetRef(offset)) {
					this.refMan.decRefCount(ref.ptr[offset], refManError);
					if (refManError.hasError()) {
						return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
					}
				}
				ref.ptr[offset] = val;
				this.sp -= 3;
				this.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
			} else if (code === "ret_val") {
				if (this.bp < 4 || this.bp > this.sp) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				let retVal = this.stack[this.sp - 1];
				let retValIsRef = this.stackMap[this.sp - 1];
				let previousBp = this.stack[this.bp - 1];
				let previousIp = this.stack[this.bp - 2];
				let previousCodeBlockId = this.stack[this.bp - 3];
				let argCount = this.stack[this.bp - 4];
				if (this.bp < 4 + argCount) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				for (let i = this.sp - 2; i >= this.bp - 4 - argCount; i--) {
					if (this.stackMap[i] === true) {
						this.refMan.decRefCount(this.stack[i], refManError);
						if (refManError.hasError()) {
							return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
						}
					}
				}
				this.sp = this.bp - 3 - argCount;
				this.stack[this.sp - 1] = retVal;
				this.stackMap[this.sp - 1] = retValIsRef;
				this.bp = previousBp;
				currentCodeBlockId = previousCodeBlockId;
				currentCodeBlock = currentCodeBlockId === -1 ? codeBlock : codeBlocks[currentCodeBlockId];
				i = previousIp;
			} else if (code === "ret") {
				if (this.bp < 4 || this.bp > this.sp) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				let previousBp = this.stack[this.bp - 1];
				let previousIp = this.stack[this.bp - 2];
				let previousCodeBlockId = this.stack[this.bp - 3];
				let argCount = this.stack[this.bp - 4];
				if (this.bp < 4 + argCount) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				for (let i = this.sp - 1; i >= this.bp - 4 - argCount; i--) {
					if (this.stackMap[i] === true) {
						this.refMan.decRefCount(this.stack[i], refManError);
						if (refManError.hasError()) {
							return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
						}
					}
				}
				this.sp = this.bp - 4 - argCount;
				this.bp = previousBp;
				currentCodeBlockId = previousCodeBlockId;
				currentCodeBlock = currentCodeBlockId === -1 ? codeBlock : codeBlocks[currentCodeBlockId];
				i = previousIp;
			} else if (code === "yield") {
				if (this.bp < 4 || this.bp >= this.sp) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				let refId = this.stack[this.bp - 4];
				let ref = this.refMan.getRefOfType(refId, "ref-frame", refManError);
				if (refManError.hasError()) {
					return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
				ref.resizeFrame(1 + (this.sp - this.bp));
				ref.ptr[1] = i;
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
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 1] = retVal;
				this.stackMap[this.sp - 1] = retValIsRef;
				this.bp = previousBp;
				currentCodeBlockId = previousCodeBlockId;
				currentCodeBlock = currentCodeBlockId === -1 ? codeBlock : codeBlocks[currentCodeBlockId];
				i = previousIp;
				this.refMan.decRefCount(refId, refManError);		
				if (refManError.hasError()) {
					return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
			} else if (code === "yield_done") {
				if (this.bp < 4 || this.bp > this.sp) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				let refId = this.stack[this.bp - 4];
				let ref = this.refMan.getRefOfType(refId, "ref-frame", refManError);
				if (refManError.hasError()) {
					return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
				ref.resizeFrame(2);
				ref.ptr[1] = i;
				let previousBp = this.stack[this.bp - 1];
				let previousIp = this.stack[this.bp - 2];
				let previousCodeBlockId = this.stack[this.bp - 3];
				for (let i = this.sp - 1; i >= this.bp - 4; i --) {
					if (this.stackMap[i] === true) {
						this.refMan.decRefCount(this.stack[i], refManError);
						if (refManError.hasError()) {
							return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
						}
					}
				}
				this.sp = this.bp - 3;
				this.stack[this.sp - 1] = 0;
				this.stackMap[this.sp - 1] = false;
				this.bp = previousBp;
				currentCodeBlockId = previousCodeBlockId;
				currentCodeBlock = currentCodeBlockId === -1 ? codeBlock : codeBlocks[currentCodeBlockId];
				i = previousIp;
			} else if (code === "next") {
				if (this.sp < 1) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				let refId = this.stack[this.sp - 1];
				let ref = this.refMan.getRefOfType(refId, "ref-frame", refManError);
				if (refManError.hasError()) {
					return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp] = currentCodeBlockId;
				this.stackMap[this.sp] = false;
				this.sp++;
				this.stack[this.sp] = i;
				this.stackMap[this.sp] = false;
				this.sp++;
				this.stack[this.sp] = this.bp;
				this.stackMap[this.sp] = false;
				this.sp++;
				this.bp = this.sp;
				for (let i = 0; i < ref.totalSize - 2; i++) {
					this.stack[this.sp] = ref.ptr[i + 2];
					this.stackMap[this.sp] = ref.mapPtr[i + 2];
					this.sp++;
				}
				currentCodeBlockId = ref.ptr[0];
				currentCodeBlock = currentCodeBlockId === -1 ? codes : codeBlocks[currentCodeBlockId];
				i = ref.ptr[1];
			} else if (code === "ended") {
				if (this.sp < 1) {
					return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				let refId = this.stack[this.sp - 1];
				let ref = this.refMan.getRefOfType(refId, "ref-frame", refManError);
				if (refManError.hasError()) {
					return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
				let ended = ref.ptr[1] >= codeBlocks[ref.ptr[0]].codeSize ? 1 : 0;
				this.refMan.decRefCount(this.stack[this.sp - 1], refManError);
				if (refManError.hasError()) {
					return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
				}
				this.stack[this.sp - 1] = ended;
			} else {
				//
				// 1 operand (in arg1)
				//
				if (i >= currentCodeBlock.codeSize) {
					return smError.codeAccessOutOfBound().fromCode(currentCodeBlockId, i);
				}
				let arg1 = currentCodeBlock.codes[i];
				i++;
				if (code === "jz") {
					if (this.sp < 1) {
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					if (this.stack[this.sp - 1] === 0) {
						i = arg1;
					}
					this.sp--;
				} else if (code === "jnz") {
					if (this.sp < 1) {
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					if (this.stack[this.sp - 1] !== 0) {
						i = arg1;
					}
					this.sp--;
				} else if (code === "jmp") {
					i = arg1;
				} else if (code === "push") {
					this.stack[this.sp] = arg1;
					this.stackMap[this.sp] = false;
					this.sp++;
				} else if (code === "push_global") {
					if (arg1 < 0 || arg1 >= this.sp) {
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					this.stack[this.sp] = this.stack[arg1];
					this.stackMap[this.sp] = this.stackMap[arg1];
					if (this.stackMap[this.sp] === true) {
						this.refMan.incRefCount(this.stack[this.sp], refManError);
						if (refManError.hasError()) {
							return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
						}
					}
					this.sp++;
				} else if (code === "push_local") {
					if (this.bp + arg1 < 0 || this.bp + arg1 >= this.sp) {
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					this.stack[this.sp] = this.stack[this.bp + arg1];
					this.stackMap[this.sp] = this.stackMap[this.bp + arg1];
					if (this.stackMap[this.sp] === true) {
						this.refMan.incRefCount(this.stack[this.sp], refManError);
						if (refManError.hasError()) {
							return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
						}
					}
					this.sp++;
				} else if (code === "pop_global") {
					if (this.sp < 1 || arg1 < 0 || arg1 >= this.sp) {
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					if (this.stackMap[arg1] === true) {
						this.refMan.decRefCount(this.stack[arg1], refManError);
						if (refManError.hasError()) {
							return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
						}						
					}
					this.stack[arg1] = this.stack[this.sp - 1];
					this.stackMap[arg1] = this.stackMap[this.sp - 1];
					this.sp--;
				} else if (code === "pop_local") {
					if (this.sp < 1 || this.bp + arg1 >= this.sp) {
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					if (this.stackMap[this.bp + arg1] === true) {
						this.refMan.decRefCount(this.stack[this.bp + arg1], refManError);
						if (refManError.hasError()) {
							return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
						}
					}
					this.stack[this.bp + arg1] = this.stack[this.sp - 1];
					this.stackMap[this.bp + arg1] = this.stackMap[this.sp - 1];
					this.sp--;
				} else if (code === "pop_void") {
					if (arg1 < 0 || arg1 > this.sp) {
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					for (let i = this.sp - 1; i >= this.sp - arg1; i--) {
						if (this.stackMap[i] === true) {
							this.refMan.decRefCount(this.stack[i], refManError);
							if (refManError.hasError()) {
								return smError.referenceManagerError(refManError).fromCode(currentCodeBlockId, i);
							}
						}
					}
					this.sp -= arg1;
				} else if (code === "create_string") {
					if (arg1 < 0 || arg1 >= currentCodeBlock.strConsts.length) {
						return smError.constAccessOutOfBound().fromCode(currentCodeBlockId, i);						
					}
					let str = currentCodeBlock.strConsts[arg1];
					this.stack[this.sp] = this.refMan.createString(str);
					this.stackMap[this.sp] = true;
					this.sp++;
				} else if (code === "create_object") {
					if (arg1 < 0 || arg1 > this.sp) {
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
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
					if (arg1 < -1 || arg1 > codeBlocks.length) {
						return smError.codeAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					this.stack[this.sp] = currentCodeBlockId;
					this.stackMap[this.sp] = false;
					this.sp++;
					this.stack[this.sp] = i;
					this.stackMap[this.sp] = false;
					this.sp++;					
					this.stack[this.sp] = this.bp;
					this.stackMap[this.sp] = false;
					this.sp++;
					this.bp = this.sp;
					currentCodeBlockId = arg1;
					currentCodeBlock = currentCodeBlockId === -1 ? codeBlock : codeBlocks[currentCodeBlockId];
					i = 0;
				} else if (code === "call_native") {
					if (arg1 < 0 || arg1 >= natives.length) {
						return smError.codeAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					if (this.sp < 1) {
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					let argCount = this.stack[this.sp - 1];
					if (this.sp < 1 + argCount) {
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					let result = natives[arg1](this);
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
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					let nbParam = this.stack[this.sp - 1];
					if (this.sp < 1) {
						return smError.codeAccessOutOfBound().fromCode(currentCodeBlockId, i);
					}
					if (nbParam < 0 || this.sp < nbParam + 1) {
						return smError.stackAccessOutOfBound().fromCode(currentCodeBlockId, i);
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
				} else {
					return smError.unknownOp().fromCode(currentCodeBlockId, i);
				}
			}
		}
		return null;
	}

}

