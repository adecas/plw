
/******************************************************************************************************************************************

	StackMachine
	
	Execute pcode
	
	
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
	
	execute(codes, codeBlocks, natives) {
		let currentCodeBlock = codes;
		let currentCodeBlockId = -1;
		let i = 0;
		while (i < currentCodeBlock.length) {
			let code = currentCodeBlock[i];
			i++;
			if (code === "debug") {
				console.log(this);
			} else if (code === "swap") {
				let tmp = this.stack[this.sp - 2];
				this.stack[this.sp - 2] = this.stack[this.sp - 1];
				this.stack[this.sp - 1] = tmp;
				let tmpMap = this.stackMap[this.sp - 2];
				this.stackMap[this.sp - 2] = this.stackMap[this.sp - 1];
				this.stackMap[this.sp - 1] = tmpMap;
			} else if (code === "add") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "add on ref not allowed";
				}
				this.stack[this.sp - 2] += this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "sub") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "sub on ref not allowed";
				}
				this.stack[this.sp - 2] -= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "div") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "div on ref not allowed";
				}
				let divisor = this.stack[this.sp - 1];
				if (divisor === 0) {
					return "div by zero";
				}
				this.stack[this.sp - 2] = Math.trunc(this.stack[this.sp - 2] / divisor);
				this.sp--;
			} else if (code === "mul") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "mul on ref not allowed";
				}
				this.stack[this.sp - 2] *= this.stack[this.sp - 1];
				this.sp--;
			} else if (code === "neg") {
				if (this.stackMap[this.sp - 1] === true) {
					return "neg on ref not allowed";
				}
				this.stack[this.sp - 1] = -this.stack[this.sp - 1]; 
			} else if (code === "gt") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "gt on ref not allowed";
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] > this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "lt") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "lt on ref not allowed";
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] < this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "gte") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "gte on ref not allowed";
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] >= this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "lte") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "lte on ref not allowed";
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] <= this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "and") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "and on ref not allowed";
				}
				this.stack[this.sp - 2] = ((this.stack[this.sp - 2] !== 0) && (this.stack[this.sp - 1] !== 0)) ? 1 : 0;
				this.sp--;
			} else if (code === "or") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "or on ref not allowed";
				}
				this.stack[this.sp - 2] = ((this.stack[this.sp - 2] !== 0) || (this.stack[this.sp - 1] !== 0)) ? 1 : 0;
				this.sp--;
			} else if (code === "not") {
				if (this.stackMap[this.sp - 1] === true) {
					return "not on ref not allowed";
				}
				this.stack[this.sp - 1] = this.stack[this.sp - 1] === 0 ? 1 : 0;
			} else if (code === "eq" || code === "eq_str") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "eq on ref not allowed";
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] === this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "ne") {
				if (this.stackMap[this.sp - 2] === true || this.stackMap[this.sp - 1] === true) {
					return "ne on ref not allowed";
				}
				this.stack[this.sp - 2] = (this.stack[this.sp - 2] !== this.stack[this.sp - 1]) ? 1 : 0;
				this.sp--;
			} else if (code === "push_ptr_offset") {
				if (this.stackMap[this.sp - 2] !== true) {
					return "push_ptr_offset ptr must be a ref";
				}
				if (this.stackMap[this.sp - 1] === true) {
					return "push_ptr_offset offset must not be a ref";
				}
				let refId = this.stack[this.sp - 2];
				let ptr = this.refMan.objectPtr(refId);
				let offset = this.stack[this.sp - 1];
				if (offset < 0 || offset >= this.refMan.objectSize(refId)) {
					return "push_ptr_offset: offset " + offset + " out of bound for refid " + refId;;
				}
				this.stack[this.sp - 2] = ptr[offset];
				this.stackMap[this.sp - 2] = this.refMan.objectIsOffsetRef(refId, offset);
				if (this.stackMap[this.sp - 2] === true) {
					this.refMan.incRefCount(ptr[offset]);
				}
				this.sp--;
				this.refMan.decRefCount(refId);
			} else if (code === "pop_ptr_offset") {
				if (this.stackMap[this.sp - 3] !== true) {
					return "pop_ptr_offset ptr must be a ref";
				}
				if (this.stackMap[this.sp - 2] === true) {
					return "pop_ptr_offset offset must not be a ref";
				}
				let refId = this.stack[this.sp - 3];
				let ptr = this.refMan.objectPtr(refId);
				let offset = this.stack[this.sp - 2];
				let offsetIsRef = this.refMan.objectIsOffsetRef(refId, offset);
				let val = this.stack[this.sp - 1];
				if (this.stackMap[this.sp - 1] !== offsetIsRef) {
					return "pop_ptr_offset val is ref mismatch ptr offset";
				}
				if (offset < 0 || offset >= this.refMan.objectSize(refId)) {
					return "pop_ptr_offset: offset " + offset + " out of bound for refid " + refId;
				}
				if (offsetIsRef === true) {
					this.refMan.decRefCount(ptr[offset]);
				}
				ptr[offset] = val;
				this.sp -= 3;
				this.refMan.decRefCount(refId);
			} else if (code === "ret_val") {
				let retVal = this.stack[this.sp - 1];
				let retValIsRef = this.stackMap[this.sp - 1];
				let previousBp = this.stack[this.bp - 1];
				let previousIp = this.stack[this.bp - 2];
				let previousCodeBlockId = this.stack[this.bp - 3];
				let argCount = this.stack[this.bp - 4];
				for (let i = this.sp - 2; i >= this.bp - 4 - argCount; i--) {
					if (this.stackMap[i] === true) {
						this.refMan.decRefCount(this.stack[i]);
					}
				}
				this.sp = this.bp - 3 - argCount;
				this.stack[this.sp - 1] = retVal;
				this.stackMap[this.sp - 1] = retValIsRef;
				this.bp = previousBp;
				currentCodeBlockId = previousCodeBlockId;
				currentCodeBlock = currentCodeBlockId === -1 ? codes : codeBlocks[currentCodeBlockId];
				i = previousIp;
			} else if (code === "ret") {
				let previousBp = this.stack[this.bp - 1];
				let previousIp = this.stack[this.bp - 2];
				let previousCodeBlockId = this.stack[this.bp - 3];
				let argCount = this.stack[this.bp - 4];
				for (let i = this.sp - 1; i >= this.bp - 4 - argCount; i--) {
					if (this.stackMap[i] === true) {
						this.refMan.decRefCount(this.stack[i]);
					}
				}
				this.sp = this.bp - 4 - argCount;
				this.bp = previousBp;
				currentCodeBlockId = previousCodeBlockId;
				currentCodeBlock = currentCodeBlockId === -1 ? codes : codeBlocks[currentCodeBlockId];
				i = previousIp;
			} else if (code === "yield") {
				let refId = this.stack[this.bp - 4];
				this.refMan.resizeFrame(refId, 1 + (this.sp - this.bp));
				let ptr = this.refMan.framePtr(refId);
				let mapPtr = this.refMan.frameMapPtr(refId);
				ptr[1] = i;
				for (let i = 0; i < this.sp - this.bp - 1; i++) {
					ptr[i + 2] = this.stack[this.bp + i];
					mapPtr[i + 2] = this.stackMap[this.bp + i];
				}
				let retVal = this.stack[this.sp - 1];
				let retValIsRef = this.stackMap[this.sp - 1];
				let previousBp = this.stack[this.bp - 1];
				let previousIp = this.stack[this.bp - 2];
				let previousCodeBlockId = this.stack[this.bp - 3];
				this.sp = this.bp - 3;
				this.stack[this.sp - 1] = retVal;
				this.stackMap[this.sp - 1] = retValIsRef;
				this.bp = previousBp;
				currentCodeBlockId = previousCodeBlockId;
				currentCodeBlock = currentCodeBlockId === -1 ? codes : codeBlocks[currentCodeBlockId];
				i = previousIp;
				this.refMan.decRefCount(refId);		
			} else if (code === "yield_done") {
				let refId = this.stack[this.bp - 4];
				this.refMan.resizeFrame(refId, 2);
				let ptr = this.refMan.framePtr(refId);
				ptr[1] = i;
				let previousBp = this.stack[this.bp - 1];
				let previousIp = this.stack[this.bp - 2];
				let previousCodeBlockId = this.stack[this.bp - 3];
				for (let i = this.sp - 1; i >= this.bp - 4; i --) {
					if (this.stackMap[i] === true) {
						this.refMan.decRefCount(this.stack[i]);
					}
				}
				this.sp = this.bp - 3;
				this.stack[this.sp - 1] = 0;
				this.stackMap[this.sp - 1] = false;
				this.bp = previousBp;
				currentCodeBlockId = previousCodeBlockId;
				currentCodeBlock = currentCodeBlockId === -1 ? codes : codeBlocks[currentCodeBlockId];
				i = previousIp;
			} else if (code === "length") {
			 	let l = this.refMan.objectSize(this.stack[this.sp - 1]);
			 	this.refMan.decRefCount(this.stack[this.sp - 1]);
				this.stack[this.sp - 1] = l;
				this.stackMap[this.sp - 1] = false;
			} else if (code === "next") {
				let refId = this.stack[this.sp - 1];
				let ptr = this.refMan.framePtr(refId);
				let mapPtr = this.refMan.frameMapPtr(refId);
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
				let frameSize = this.refMan.frameSize(refId);
				for (let i = 0; i < frameSize - 2; i++) {
					this.stack[this.sp] = ptr[i + 2];
					this.stackMap[this.sp] = mapPtr[i + 2];
					this.sp++;
				}
				currentCodeBlockId = ptr[0];
				currentCodeBlock = currentCodeBlockId === -1 ? codes : codeBlocks[currentCodeBlockId];
				i = ptr[1];
				if (i >= currentCodeBlock.length) {
					return "next: ip " + i + " out of bound for codeBlockId " + currentCodeBlockId;
				}
			} else if (code === "ended") {
				let refId = this.stack[this.sp - 1];
				let objPtr = this.refMan.objectPtr(refId);
				let ended = objPtr[1] >= codeBlocks[objPtr[0]].length ? 1 : 0;
				this.refMan.decRefCount(this.stack[this.sp - 1]);
				this.stack[this.sp - 1] = ended;
			} else if (code === "alloc") {
				let refSize = this.stack[this.sp - 2];
				let totalSize = this.stack[this.sp - 1];
				this.stack[this.sp - 2] = this.refMan.createObject(refSize, totalSize);
				this.stackMap[this.sp - 2] = true;
				this.sp--;
			} else if (code === "alloc_init") {
				let refSize = this.stack[this.sp - 2];
				let totalSize = this.stack[this.sp - 1];
				let refId = this.refMan.createObject(refSize, totalSize);
				for (let j = 0; j < totalSize; j++) {
					this.refMan.objectPtr(refId)[j] = currentCodeBlock[i];
					i++;
				}
				this.stack[this.sp - 2] = refId;
				this.stackMap[this.sp - 2] = true;
				this.sp--;
			} else {
				//
				// 1 operand (in arg1)
				//
				let arg1 = currentCodeBlock[i];
				i++;
				if (code === "jz") {
					this.sp--;
					if (this.stack[this.sp] === 0) {
						i = arg1;
					}
				} else if (code === "jnz") {
					this.sp--;
					if (this.stack[this.sp] !== 0) {
						i = arg1;
					}
				} else if (code === "jmp") {
					i = arg1;
				} else if (code === "push") {
					this.stack[this.sp] = arg1;
					this.stackMap[this.sp] = false;
					this.sp++;
				} else if (code === "push_global") {
					this.stack[this.sp] = this.stack[arg1];
					this.stackMap[this.sp] = this.stackMap[arg1];
					if (this.stackMap[this.sp] === true) {
						this.refMan.incRefCount(this.stack[this.sp]);
					}
					this.sp++;
				} else if (code === "push_local") {
					this.stack[this.sp] = this.stack[this.bp + arg1];
					this.stackMap[this.sp] = this.stackMap[this.bp + arg1];
					if (this.stackMap[this.sp] === true) {
						this.refMan.incRefCount(this.stack[this.sp]);
					}
					this.sp++;
				} else if (code === "push_offset") {
					this.stack[this.sp] = this.stack[this.sp + arg1];
					this.stackMap[this.sp] = this.stackMap[this.sp + arg1];
					this.sp++;
				} else if (code === "pop_global") {
					this.sp--;
					if (this.stackMap[arg1] === true) {
						this.refMan.decRefCount(this.stack[arg1]);
					}
					this.stack[arg1] = this.stack[this.sp];
					this.stackMap[arg1] = this.stackMap[this.sp];
				} else if (code === "pop_local") {
					this.sp--;
					if (this.stackMap[this.bp + arg1] === true) {
						this.refMan.decRefCount(this.stack[this.bp + arg1]);
					}
					this.stack[this.bp + arg1] = this.stack[this.sp];
					this.stackMap[this.bp + arg1] = this.stackMap[this.sp];
				} else if (code === "pop_ptr") {
					this.refMan.objectPtr(this.stack[this.sp - 2])[arg1] = this.stack[this.sp - 1];
					this.sp--;
				} else if (code === "pop_void") {
					for (let i = this.sp - 1; i >= this.sp - arg1; i--) {
						if (this.stackMap[i] === true) {
							this.refMan.decRefCount(this.stack[i]);
						}
					}
					this.sp -= arg1;
				} else if (code === "call") {
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
					currentCodeBlock = currentCodeBlockId === -1 ? codes : codeBlocks[currentCodeBlockId];
					i = 0;
				} else if (code === "call_native") {
					natives[arg1](this);
				} else if (code === "init_generator") {
					// stack is:
					//   arg1              sp - nbParam - 1
					//   ...
					//   argN
					//   nbParam           sp - 1
					let nbParam = this.stack[this.sp - 1];
					let refId = this.refMan.createFrame(nbParam + 2);
					let ptr = this.refMan.framePtr(refId);
					let mapPtr = this.refMan.frameMapPtr(refId);
					ptr[0] = arg1;
					ptr[1] = 0;
					for (let i = 0; i < nbParam; i++) {
						ptr[i + 2] = this.stack[this.sp - nbParam - 1 + i];
						mapPtr[i + 2] = this.stackMap[this.sp - nbParam - 1 + i];
					}
					this.stack[this.sp - nbParam - 1] = refId;
					this.stackMap[this.sp - nbParam - 1] = true;
					this.sp -= nbParam;
				} else {
					return "Unknown op " + code;
				}
			}
		}
		return "ok";
	}

}

