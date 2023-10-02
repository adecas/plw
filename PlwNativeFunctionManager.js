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
	
	
	static initStdNativeFunctions(compiler) {
		let nativeFunctionManager = new NativeFunctionManager();	
				
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"get_char",
			new EvalResultParameterList(0, []),
			EVAL_TYPE_CHAR,
			nativeFunctionManager.addFunction(function(sm) {
				return StackMachineError.trap("@get_char");
			})
		));	
		
		compiler.context.addProcedure(EvalResultProcedure.fromNative(
			"write",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				addTextOut(ref.str);
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.sp -= 2;
				return null;
			})
		));		
		
		compiler.context.addProcedure(EvalResultProcedure.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				printTextOut(ref.str);
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.sp -= 2;
				return null;
			})
		));

		compiler.context.addFunction(EvalResultFunction.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				printTextOut(ref.str);
				sm.sp -= 1;
				return null;
			})
		));

		compiler.context.addFunction(EvalResultFunction.fromNative(
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
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
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
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_CHAR)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = PlwStringRef.make(sm.refMan, String.fromCharCode(sm.stack[sm.sp - 2]));
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
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
							
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"length",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let len = ref.str.length;
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = len;
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
				
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compiler.addType(new EvalTypeArray(EVAL_TYPE_CHAR)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let resultId = PlwStringRef.make(sm.refMan, String.fromCharCode(...ref.ptr));
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compiler.addType(new EvalTypeArray(EVAL_TYPE_INTEGER)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let resultId = PlwStringRef.make(sm.refMan, "[" + ref.ptr + "]");
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compiler.addType(new EvalTypeArray(EVAL_TYPE_BOOLEAN)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let resultId = PlwStringRef.make(sm.refMan, "[" + ref.ptr + "]");
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compiler.addType(new EvalTypeArray(EVAL_TYPE_TEXT)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let str = "[";
				for (let i = 0; i < ref.blobSize; i++) {
					let subRef = sm.refMan.getRefOfType(ref.ptr[i], PLW_TAG_REF_STRING, sm.refManError);
					if (sm.hasRefManError()) {
						return sm.errorFromRefMan();
					}
					str += (i > 0 ? ", " : "") + subRef.str;
				}
				str += "]";
				let resultId = PlwStringRef.make(sm.refMan, str);
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compiler.context.addFunction(EvalResultFunction.fromNative(
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
				let refId1 = sm.stack[sm.sp - 3];
				let refId2 = sm.stack[sm.sp - 2];
				let ref1 = sm.refMan.getRefOfType(refId1, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let ref2 = sm.refMan.getRefOfType(refId2, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				if (ref1.refCount === 1) {
					ref1.str += ref2.str;
					sm.refMan.decRefCount(refId2, sm.refManError);
					if (sm.hasRefManError()) {
						return sm.errorFromRefMan();
					}
				} else {
					let resultRefId = PlwStringRef.make(sm.refMan, ref1.str + ref2.str);
					sm.refMan.decRefCount(refId1, sm.refManError);
					if (sm.hasRefManError()) {
						return sm.errorFromRefMan();
					}
					sm.refMan.decRefCount(refId2, sm.refManError);
					if (sm.hasRefManError()) {
						return sm.errorFromRefMan();
					}
					sm.stack[sm.sp - 3] = resultRefId;
					sm.stackMap[sm.sp - 3] = true;
				}
				sm.sp -= 2;
				return null;
			})
		));


		compiler.context.addFunction(EvalResultFunction.fromNative(
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
				let refId = sm.stack[sm.sp - 4];
				let beginIndex = sm.stack[sm.sp - 3];
				let length = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
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
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 4] = resultRefId;
				sm.stackMap[sm.sp - 4] = true;
				sm.sp -= 3;
				return null;
			})
		));	
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"subtext",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT),
				new EvalResultParameter("beginIndex", EVAL_TYPE_INTEGER)
			]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 3];
				let beginIndex = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				if (beginIndex < 0) {
					return StackMachineError.refAccessOutOfBound();
				}
				if (beginIndex > ref.str.length) {
					return StackMachineError.refAccessOutOfBound();
				}
				let resultRefId = PlwStringRef.make(sm.refMan, ref.str.substr(beginIndex));
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = resultRefId;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"trim",
			new EvalResultParameterList(1, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT)
			]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let resultRefId = PlwStringRef.make(sm.refMan, ref.str.trim());
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = resultRefId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));	

		compiler.context.addFunction(EvalResultFunction.fromNative(
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
				let refId = sm.stack[sm.sp - 3];
				let index = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				if (index < 0 || index >= ref.str.length) {
					return StackMachineError.refAccessOutOfBound();
				}
				let charCode = ref.str.charCodeAt(index)
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = charCode;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
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
				let refId = sm.stack[sm.sp - 3];
				let index = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				if (index < 0 || index >= ref.str.length) {
					return StackMachineError.refAccessOutOfBound();
				}
				let charCode = ref.str.charCodeAt(index)
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = charCode;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
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
				let ch = sm.stack[sm.sp - 3];
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let index = ref.str.indexOf(String.fromCharCode(ch));
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = index;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"index_of",
			new EvalResultParameterList(2, [
				new EvalResultParameter("c", EVAL_TYPE_TEXT),
				new EvalResultParameter("t", EVAL_TYPE_TEXT)
			]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refIdSub = sm.stack[sm.sp - 3];
				let refSub = sm.refMan.getRefOfType(refIdSub, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let index = ref.str.indexOf(refSub.str);
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.refMan.decRefCount(refIdSub, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = index;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"split",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT),
				new EvalResultParameter("s", EVAL_TYPE_TEXT)
			]),
			compiler.addType(new EvalTypeArray(EVAL_TYPE_TEXT)),
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 3];
				let sepId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let sep = sm.refMan.getRefOfType(sepId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let strs = ref.str.split(sep.str);
				let strIds = new Array(strs.length);
				for (let i = 0; i < strs.length; i++) {
					strIds[i] = PlwStringRef.make(sm.refMan, strs[i]);
				}
				let resultId = PlwBlobRef.make(sm.refMan, strs.length, strIds, new Array(strs.length).fill(true));
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.refMan.decRefCount(sepId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = resultId;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
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
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
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

		compiler.context.addFunction(EvalResultFunction.fromNative(
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
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
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
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
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
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
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
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"integer",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let result = parseInt(ref.str);
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = result;
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"ceil",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REAL)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = Math.ceil(sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"floor",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REAL)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = Math.floor(sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		return nativeFunctionManager;
	}
}

