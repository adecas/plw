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
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"get_char",
			new EvalResultParameterList(0, []),
			EVAL_TYPE_CHAR,
			nativeFunctionManager.addFunction(function(sm) {
				return StackMachineError.trap("@get_char");
			})
		));	
		
		compilerContext.addProcedure(EvalResultProcedure.fromNative(
			"write",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				addTextOut(ref.str);
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.sp -= 2;
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
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
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
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
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
				sm.stack[sm.sp - 2] = PlwStringRef.make(sm.refMan, "" + sm.stack[sm.sp - 2]);
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
				sm.stack[sm.sp - 2] = PlwStringRef.make(sm.refMan, "" + sm.stack[sm.sp - 2]);
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
				sm.stack[sm.sp - 2] = PlwStringRef.make(sm.refMan, sm.stack[sm.sp - 2] === 1 ? "true" : "false");
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));
				
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"length_basic_array",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REF)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let len = ref.arraySize;
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
			"last_index_basic_array",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REF)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let lastIndex = ref.arraySize - 1;
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = lastIndex;
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"length_array",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REF)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let len = ref.arraySize;
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
			"last_index_array",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REF)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let lastIndex = ref.arraySize - 1;
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = lastIndex;
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
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
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
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let resultId = PlwStringRef.make(sm.refMan, String.fromCharCode(...ref.ptr));
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
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let resultId = PlwStringRef.make(sm.refMan, "[" + ref.ptr + "]");
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
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let str = "[";
				for (let i = 0; i < ref.arraySize; i++) {
					let subRef = sm.refMan.getRefOfType(ref.ptr[i], PLW_TAG_REF_STRING, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
					str += (i > 0 ? ", " : "") + subRef.str;
				}
				str += "]";
				let resultId = PlwStringRef.make(sm.refMan, str);
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
				let refManError = new PlwRefManagerError();
				let refId1 = sm.stack[sm.sp - 3];
				let refId2 = sm.stack[sm.sp - 2];
				let ref1 = sm.refMan.getRefOfType(refId1, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let ref2 = sm.refMan.getRefOfType(refId2, PLW_TAG_REF_STRING, refManError);
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
					let resultRefId = PlwStringRef.make(sm.refMan, ref1.str + ref2.str);
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
				let refManError = new PlwRefManagerError();
				let refId = sm.stack[sm.sp - 4];
				let beginIndex = sm.stack[sm.sp - 3];
				let length = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
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
				let resultRefId = PlwStringRef.make(sm.refMan, length === 0 ? "" : ref.str.substr(beginIndex, length));
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
				let refManError = new PlwRefManagerError();
				let refId = sm.stack[sm.sp - 3];
				let index = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
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
			"char_at",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT),
				new EvalResultParameter("i", EVAL_TYPE_INTEGER)
			]),
			EVAL_TYPE_CHAR,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new PlwRefManagerError();
				let refId = sm.stack[sm.sp - 3];
				let index = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
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
			"index_of",
			new EvalResultParameterList(2, [
				new EvalResultParameter("c", EVAL_TYPE_CHAR),
				new EvalResultParameter("t", EVAL_TYPE_TEXT)
			]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new PlwRefManagerError();
				let ch = sm.stack[sm.sp - 3];
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let index = ref.str.indexOf(String.fromCharCode(ch));
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 3] = index;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"split",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT),
				new EvalResultParameter("s", EVAL_TYPE_TEXT)
			]),
			compilerContext.addType(new EvalTypeArray(EVAL_TYPE_TEXT)),
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new PlwRefManagerError();
				let refId = sm.stack[sm.sp - 3];
				let sepId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let sep = sm.refMan.getRefOfType(sepId, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let strs = ref.str.split(sep.str);
				let strIds = new Array(strs.length);
				for (let i = 0; i < strs.length; i++) {
					strIds[i] = PlwStringRef.make(sm.refMan, strs[i]);
				}
				let resultId = PlwArrayRef.make(sm.refMan, strs.length, strIds);
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.refMan.decRefCount(sepId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 3] = resultId;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
				return null;
			})
		));

		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"slice_basic_array",
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
				let refManError = new PlwRefManagerError();
				let refId = sm.stack[sm.sp - 4];
				let beginIndex = sm.stack[sm.sp - 3];
				let endIndex = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BASIC_ARRAY, refManError);
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
				let resultRefId = PlwBasicArrayRef.make(sm.refMan, arraySize, ptr);
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
				let refManError = new PlwRefManagerError();
				let refId = sm.stack[sm.sp - 4];
				let beginIndex = sm.stack[sm.sp - 3];
				let endIndex = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_ARRAY, refManError);
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
				for (let i = 0; i < arraySize; i++) {
					sm.refMan.incRefCount(ptr[i], refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
				}
				let resultRefId = PlwArrayRef.make(sm.refMan, arraySize, ptr);
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
			"in_basic_array",
			new EvalResultParameterList(2, [
				new EvalResultParameter("item", EVAL_TYPE_INTEGER),
				new EvalResultParameter("array", EVAL_TYPE_REF)
			]),
			EVAL_TYPE_BOOLEAN,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new PlwRefManagerError();
				let item = sm.stack[sm.sp - 3];
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let isIn = ref.ptr.indexOf(item) > -1 ? 1 : 0;
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 3] = isIn;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"concat_basic_array",
			new EvalResultParameterList(2, [
				new EvalResultParameter("a1", EVAL_TYPE_REF),
				new EvalResultParameter("a2", EVAL_TYPE_REF)
			]),
			EVAL_TYPE_REF,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new PlwRefManagerError();
				let refId1 = sm.stack[sm.sp - 3];
				let refId2 = sm.stack[sm.sp - 2];
				let ref1 = sm.refMan.getRefOfType(refId1, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}		
				let ref2 = sm.refMan.getRefOfType(refId2, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let newArraySize = ref1.arraySize + ref2.arraySize;
				let ptr = ref1.ptr.concat(ref2.ptr);
				let resultRefId = PlwBasicArrayRef.make(sm.refMan, newArraySize, ptr);
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
				let refManError = new PlwRefManagerError();
				let refId1 = sm.stack[sm.sp - 3];
				let refId2 = sm.stack[sm.sp - 2];
				let ref1 = sm.refMan.getRefOfType(refId1, PLW_TAG_REF_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}		
				let ref2 = sm.refMan.getRefOfType(refId2, PLW_TAG_REF_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let newArraySize = ref1.arraySize + ref2.arraySize;
				let ptr = ref1.ptr.concat(ref2.ptr);
				for (let i = 0; i < newArraySize; i++) {
					sm.refMan.incRefCount(ptr[i], refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
				}
				let resultRefId = PlwArrayRef.make(sm.refMan, newArraySize, ptr);
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
				sm.stack[sm.sp - 3] = Math.floor(Math.random() * (highBound - lowBound + 1)) + lowBound;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"integer",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let result = parseInt(ref.str);
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = result;
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));

		return nativeFunctionManager;
	}
}

