"use strict";

class NativeFunctionManager {
	constructor() {
		this.functions = [];
		this.functionCount = 0;
	}
	
	addFunction(f) {
		let i = this.functionCount;
		this.functions[i] = f;
		this.functionCount++;
		return i;
	}
	
	static initStdNativeFunctions(compilerContext) {
		let nativeFunctionManager = new NativeFunctionManager();
		
		compilerContext.addProcedure(EvalResultProcedure.fromNative(
			"debug",
			new EvalResultParameterList(0, []),
			nativeFunctionManager.addFunction(function(sm) {
				console.log(sm);
				return null;
			})
		));


		compilerContext.addProcedure(EvalResultProcedure.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new RefManagerError();
				let ref = sm.refMan.getRefOfType(refId, TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				printTextOut(ref.str);
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.sp -= 2;
				return null;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new RefManagerError();
				let ref = sm.refMan.getRefOfType(refId, TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				printTextOut(ref.str);
				sm.sp -= 1;
				return null;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_INTEGER)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = sm.refMan.createString("" + sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REAL)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = sm.refMan.createString("" + sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_BOOLEAN)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = sm.refMan.createString(sm.stack[sm.sp - 2] === 1 ? "true" : "false");
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));
				
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"length",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REF)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new RefManagerError();
				let ref = sm.refMan.getRef(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let len = 0;
				if (ref.tag === TAG_REF_PRIMARRAY) {
					len = ref.arraySize;
				} else if (ref.tag === TAG_REF_OBJECT) {
					len = ref.totalSize;
				} else {
					return StackMachineError.invalidRefType();
				}
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = len;
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"length",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new RefManagerError();
				let ref = sm.refMan.getRefOfType(refId, TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let len = ref.str.length;
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = len;
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compilerContext.addType(new EvalTypeArray(EVAL_TYPE_CHAR)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new RefManagerError();
				let ref = sm.refMan.getRefOfType(refId, TAG_REF_PRIMARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let resultId = sm.refMan.createString(String.fromCharCode(...ref.ptr));
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compilerContext.addType(new EvalTypeArray(EVAL_TYPE_INTEGER)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new RefManagerError();
				let ref = sm.refMan.getRefOfType(refId, TAG_REF_PRIMARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let resultId = sm.refMan.createString("[" + ref.ptr + "]");
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compilerContext.addType(new EvalTypeArray(EVAL_TYPE_TEXT)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new RefManagerError();
				let ref = sm.refMan.getRefOfType(refId, TAG_REF_OBJECT, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let str = "[";
				for (let i = 0; i < ref.totalSize; i++) {
					let subRef = sm.refMan.getRefOfType(ref.ptr[i], TAG_REF_STRING, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
					str += (i > 0 ? ", " : "") + subRef.str;
				}
				str += "]";
				let resultId = sm.refMan.createString(str);
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"concat",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t1", EVAL_TYPE_TEXT),
				new EvalResultParameter("t2", EVAL_TYPE_TEXT)
			]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new RefManagerError();
				let refId1 = sm.stack[sm.sp - 3];
				let refId2 = sm.stack[sm.sp - 2];
				let ref1 = sm.refMan.getRefOfType(refId1, TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let ref2 = sm.refMan.getRefOfType(refId2, TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				if (ref1.refCount === 1) {
					ref1.str += ref2.str;
					sm.refMan.decRefCount(refId2, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
				} else {
					let resultRefId = sm.refMan.createString(ref1.str + ref2.str);
					sm.refMan.decRefCount(refId1, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
					sm.refMan.decRefCount(refId2, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
					sm.stack[sm.sp - 3] = resultRefId;
					sm.stackMap[sm.sp - 3] = true;
				}
				sm.sp -= 2;
				return null;
			})
		));


		compilerContext.addFunction(EvalResultFunction.fromNative(
			"subtext",
			new EvalResultParameterList(3, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT),
				new EvalResultParameter("beginIndex", EVAL_TYPE_INTEGER),
				new EvalResultParameter("length", EVAL_TYPE_INTEGER),
			]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 3) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new RefManagerError();
				let refId = sm.stack[sm.sp - 4];
				let beginIndex = sm.stack[sm.sp - 3];
				let length = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				if (beginIndex < 0) {
					return StackMachineError.refAccessOutOfBound();
				}
				if (length < 0) {
					length = 0;
				}
				if (beginIndex + length > ref.str.length) {
					return StackMachineError.refAccessOutOfBound();
				}
				let resultRefId = sm.refMan.createString(length === 0 ? "" : ref.str.substr(beginIndex, length));
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 4] = resultRefId;
				sm.stackMap[sm.sp - 4] = true;
				sm.sp -= 3;
				return null;
			})
		));	
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"char_code",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT),
				new EvalResultParameter("i", EVAL_TYPE_INTEGER)
			]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new RefManagerError();
				let refId = sm.stack[sm.sp - 3];
				let index = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				if (index < 0 || index >= ref.str.length) {
					return StackMachineError.refAccessOutOfBound();
				}
				let charCode = ref.str.charCodeAt(index)
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 3] = charCode;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"slice_primarray",
			new EvalResultParameterList(3, [
				new EvalResultParameter("array", EVAL_TYPE_REF),
				new EvalResultParameter("beginIndex", EVAL_TYPE_INTEGER),
				new EvalResultParameter("endIndex", EVAL_TYPE_INTEGER),
			]),
			EVAL_TYPE_REF,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 3) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new RefManagerError();
				let refId = sm.stack[sm.sp - 4];
				let beginIndex = sm.stack[sm.sp - 3];
				let endIndex = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, TAG_REF_PRIMARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				if (beginIndex < 0 || endIndex >= ref.arraySize) {
					return StackMachineError.refAccessOutOfBound();
				}
				let arraySize = endIndex - beginIndex + 1;
				if (arraySize < 0) {
					arraySize = 0;
				}
				let ptr = ref.ptr.slice(beginIndex, beginIndex + arraySize);
				let resultRefId = sm.refMan.createPrimarray(arraySize, ptr);
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 4] = resultRefId;
				sm.stackMap[sm.sp - 4] = true;
				sm.sp -= 3;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"slice_array",
			new EvalResultParameterList(3, [
				new EvalResultParameter("array", EVAL_TYPE_REF),
				new EvalResultParameter("beginIndex", EVAL_TYPE_INTEGER),
				new EvalResultParameter("endIndex", EVAL_TYPE_INTEGER),
			]),
			EVAL_TYPE_REF,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 3) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new RefManagerError();
				let refId = sm.stack[sm.sp - 4];
				let beginIndex = sm.stack[sm.sp - 3];
				let endIndex = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, TAG_REF_OBJECT, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				if (beginIndex < 0) {
					return StackMachineError.refAccessOutOfBound();
				}
				if (endIndex >= ref.totalSize) {
					return StackMachineError.refAccessOutOfBound();
				}
				let totalSize = endIndex - beginIndex + 1;
				if (totalSize < 0) {
					totalSize = 0;
				}
				let refSize = ref.refSize - beginIndex;
				if (refSize < 0) {
					refSize = 0;
				} else if (refSize > totalSize) {
					refSize = totalSize;
				}
				let ptr = new Array(totalSize);
				for (let i = 0; i < totalSize; i++) {
					ptr[i] = ref.ptr[beginIndex + i];
				}
				for (let i = 0; i < refSize; i++) {
					sm.refMan.incRefCount(ptr[i], refManError);
					if (refManError.hasError()) {
						return -1;
					}
				}
				let resultRefId = sm.refMan.createObject(refSize, totalSize, ptr);
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 4] = resultRefId;
				sm.stackMap[sm.sp - 4] = true;
				sm.sp -= 3;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"concat_primarray",
			new EvalResultParameterList(2, [
				new EvalResultParameter("a1", EVAL_TYPE_REF),
				new EvalResultParameter("a2", EVAL_TYPE_REF)
			]),
			EVAL_TYPE_REF,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new RefManagerError();
				let refId1 = sm.stack[sm.sp - 3];
				let refId2 = sm.stack[sm.sp - 2];
				let ref1 = sm.refMan.getRefOfType(refId1, TAG_REF_PRIMARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}		
				let ref2 = sm.refMan.getRefOfType(refId2, TAG_REF_PRIMARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let newArraySize = ref1.arraySize + ref2.arraySize;
				let ptr = ref1.ptr.concat(ref2.ptr);
				let resultRefId = sm.refMan.createPrimarray(newArraySize, ptr);
				sm.refMan.decRefCount(refId1, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.refMan.decRefCount(refId2, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 3] = resultRefId;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
				return null;
			})
		));

		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"concat_array",
			new EvalResultParameterList(2, [
				new EvalResultParameter("a1", EVAL_TYPE_REF),
				new EvalResultParameter("a2", EVAL_TYPE_REF)
			]),
			EVAL_TYPE_REF,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new RefManagerError();
				let refId1 = sm.stack[sm.sp - 3];
				let refId2 = sm.stack[sm.sp - 2];
				let ref1 = sm.refMan.getRef(refId1, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}		
				let ref2 = sm.refMan.getRef(refId2, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let resultRefId = -1;
				if (ref1.tag === TAG_REF_PRIMARRAY && ref1.arraySize === 0) {
					sm.refMan.decRefCount(refId1, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
					resultRefId = refId2;
				} else if(ref2.tag === TAG_REF_PRIMARRAY && ref2.arraySize === 0) {
					sm.refMan.decRefCount(refId2, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
					resultRefId = refId1;
				} else if (ref1.tag === TAG_REF_OBJECT && ref2.tag === TAG_REF_OBJECT) {
					let totalSize = ref1.totalSize + ref2.totalSize;
					let refSize = ref1.refSize + ref2.refSize;
					let ptr = [];
					for (let i = 0; i < ref1.refSize; i++) {
						ptr[i] = ref1.ptr[i];
					}
					for (let i = 0; i < ref2.refSize; i++) {
						ptr[ref1.refSize + i] = ref2.ptr[i];
					}
					for (let i = 0; i < ref1.totalSize - ref1.refSize; i++) {
						ptr[refSize + i] = ref1.ptr[ref1.refSize + i];
					}
					for (let i = 0; i < ref2.totalSize - ref2.refSize; i++) {
						ptr[refSize + ref1.totalSize - ref1.refSize + i] = ref2.ptr[ref2.refSize + i];
					}
					for (let i = 0; i < refSize; i++) {
						sm.refMan.incRefCount(ptr[i], refManError);
						if (refManError.hasError()) {
							return StackMachineError.referenceManagerError(refManError);
						}
					}
					resultRefId = sm.refMan.createObject(refSize, totalSize, ptr);
					sm.refMan.decRefCount(refId1, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
					sm.refMan.decRefCount(refId2, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}				
				} else {
				}
				sm.stack[sm.sp - 3] = resultRefId;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"abs",
			new EvalResultParameterList(1, [new EvalResultParameter("i", EVAL_TYPE_INTEGER)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();				
				}
				let val = sm.stack[sm.sp -2];
				if (val < 0) {
					sm.stack[sm.sp -2] = -val;
				}
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));

		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"real",
			new EvalResultParameterList(1, [new EvalResultParameter("i", EVAL_TYPE_INTEGER)]),
			EVAL_TYPE_REAL,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"sqrt",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REAL)]),
			EVAL_TYPE_REAL,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = Math.sqrt(sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"log",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REAL)]),
			EVAL_TYPE_REAL,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = Math.log(sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"now",
			new EvalResultParameterList(0, []),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 0) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 1] = Date.now();
				sm.stackMap[sm.sp - 1] = false;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"random",
			new EvalResultParameterList(2, [
				new EvalResultParameter("low_bound", EVAL_TYPE_INTEGER),
				new EvalResultParameter("high_bound", EVAL_TYPE_INTEGER)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let lowBound = sm.stack[sm.sp - 3];
				let highBound = sm.stack[sm.sp - 2];
				sm.stack[sm.sp - 3] = Math.floor(Math.random() * (highBound - lowBound) + 1) + lowBound;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));

		return nativeFunctionManager;
	}
}

