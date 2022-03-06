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
			})
		));


		compilerContext.addProcedure(EvalResultProcedure.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			nativeFunctionManager.addFunction(function(sm) {
				let t = sm.stack[sm.sp - 2];
				printTextOut(sm.refMan.stringStr(t));
				sm.refMan.decRefCount(t);
				sm.sp -= 2;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				let t = sm.stack[sm.sp - 2];
				printTextOut(sm.refMan.stringStr(t));
				sm.sp -= 1;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_INTEGER)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				sm.stack[sm.sp - 2] = sm.refMan.createString("" + sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_BOOLEAN)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				sm.stack[sm.sp - 2] = sm.refMan.createString(sm.stack[sm.sp - 2] === 1 ? "true" : "false");
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
			})
		));


		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compilerContext.addType(new EvalTypeArray(EVAL_TYPE_INTEGER)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				let refId = sm.stack[sm.sp - 2];
				let ptr = sm.refMan.objectPtr(refId);
				let resultId = sm.refMan.createString("[" + ptr + "]");
				sm.refMan.decRefCount(refId);
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compilerContext.addType(new EvalTypeArray(EVAL_TYPE_TEXT)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				let refId = sm.stack[sm.sp - 2];
				let ptr = sm.refMan.objectPtr(refId);
				let len = sm.refMan.objectSize(refId);
				let str = "[";
				for (let i = 0; i < len; i++) {
					str += (i > 0 ? ", " : "") + sm.refMan.stringStr(ptr[i]);
				}
				str += "]";
				let resultId = sm.refMan.createString(str);
				sm.refMan.decRefCount(refId);
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"array",
			new EvalResultParameterList(2, [
				new EvalResultParameter("val", EVAL_TYPE_INTEGER),
				new EvalResultParameter("count", EVAL_TYPE_INTEGER)
			]),
			compilerContext.addType(new EvalTypeArray(EVAL_TYPE_INTEGER)),
			nativeFunctionManager.addFunction(function(sm) {
				let val = sm.stack[sm.sp - 3];
				let count = sm.stack[sm.sp - 2]; 
				let r = sm.refMan.createObject(0, count);
				for (let i = 0; i < count; i++) {
					sm.refMan.objectPtr(r)[i] = val;
				}
				sm.stack[sm.sp - 3] = r;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
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
				let t1 = sm.stack[sm.sp - 3];
				let t2 = sm.stack[sm.sp - 2];
				let r = sm.refMan.createString(sm.refMan.stringStr(t1) + sm.refMan.stringStr(t2));
				sm.refMan.decRefCount(t1);
				sm.refMan.decRefCount(t2);
				sm.stack[sm.sp - 3] = r;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
			})
		));	
		
		return nativeFunctionManager;
	}
}

